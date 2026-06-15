# Webshop Backend — Architecture & Implementation Spec

---

## System Overview

A modular monolith Spring Boot REST API backend for an e-commerce webshop. The frontend (Bootstrap HTML) consumes JSON APIs. No user authentication in MVP — only `ROLE_ADMIN` for admin endpoints. PostgreSQL is the persistence layer, Flyway handles schema migrations, and a pluggable importer interface is designed from day one for future distributor integrations.

---

## Assumptions

1. Admin authentication uses HTTP Basic Auth or a hardcoded JWT secret for MVP — no user registration flow needed.
2. "Related products" returns up to 4 active products from the same category, excluding the current product.
3. `slug` is auto-generated from `name` on create if not provided.
4. `order_number` is a system-generated human-readable string (e.g., `ORD-20260613-0001`).
5. Product images are stored as external URLs (no file upload in MVP).
6. `EAN` uniqueness is enforced at DB level with a partial unique index (nullable).
7. Soft delete is not required — hard delete is fine for MVP, with a foreign key guard on products referenced in orders.
8. Category deletion is blocked if child categories or products exist.
9. `delivery_address` is stored as a plain text string for MVP simplicity.
10. Swagger UI is publicly accessible (no auth).

---

## Data Model

### Entities & Relationships

```
Brand (1) ──< Product (N)
Category (1) ──< Product (N)
Category (1) ──< Category (N)   [self-referencing parent_id]
Product (1) ──< ProductImage (N)
Product (1) ──< ProductSpecification (N)
Order (1) ──< OrderItem (N)
OrderItem (N) >── Product (1)   [product_id FK, but name/price copied at order time]
```

### Table Definitions

```sql
-- brands
id BIGSERIAL PK, name VARCHAR NOT NULL, logo_url VARCHAR,
created_at TIMESTAMP, updated_at TIMESTAMP

-- categories
id BIGSERIAL PK, name VARCHAR NOT NULL, slug VARCHAR UNIQUE NOT NULL,
parent_id BIGINT FK(categories.id) NULLABLE, created_at, updated_at

-- products
id BIGSERIAL PK, sku VARCHAR UNIQUE NOT NULL, ean VARCHAR NULLABLE,
manufacturer_code VARCHAR, name VARCHAR NOT NULL, slug VARCHAR UNIQUE NOT NULL,
short_description TEXT, description TEXT, brand_id BIGINT FK, category_id BIGINT FK,
price NUMERIC(10,2) NOT NULL, old_price NUMERIC(10,2), stock_quantity INT DEFAULT 0,
warranty_months INT, weight NUMERIC(8,3), active BOOLEAN DEFAULT TRUE,
created_at TIMESTAMP, updated_at TIMESTAMP
-- partial unique index on ean WHERE ean IS NOT NULL

-- product_images
id BIGSERIAL PK, product_id BIGINT FK NOT NULL, image_url VARCHAR NOT NULL,
sort_order INT DEFAULT 0, is_main BOOLEAN DEFAULT FALSE

-- product_specifications
id BIGSERIAL PK, product_id BIGINT FK NOT NULL,
specification_name VARCHAR NOT NULL, specification_value VARCHAR NOT NULL

-- orders
id BIGSERIAL PK, order_number VARCHAR UNIQUE NOT NULL,
customer_name VARCHAR NOT NULL, customer_email VARCHAR NOT NULL,
customer_phone VARCHAR, delivery_address TEXT NOT NULL,
total_price NUMERIC(10,2) NOT NULL, order_status VARCHAR NOT NULL DEFAULT 'CREATED',
created_at TIMESTAMP, updated_at TIMESTAMP

-- order_items
id BIGSERIAL PK, order_id BIGINT FK NOT NULL, product_id BIGINT FK,
product_name VARCHAR NOT NULL, product_price NUMERIC(10,2) NOT NULL,
quantity INT NOT NULL, total_price NUMERIC(10,2) NOT NULL
```

---

## API Design

### Public Endpoints

#### GET /api/categories

Returns the full category tree.

```json
[
  {
    "id": 1,
    "name": "Computers",
    "slug": "computers",
    "parentId": null,
    "children": [
      { "id": 2, "name": "Laptops", "slug": "laptops", "parentId": 1, "children": [] }
    ]
  }
]
```

#### GET /api/products

Supports category filtering, keyword search, pagination, and sorting.

```
/api/products?category=laptops&search=i7&page=0&size=20&sort=price,asc
```

```json
{
  "content": [ "...ProductSummaryDto..." ],
  "totalElements": 100,
  "totalPages": 5,
  "page": 0,
  "size": 20
}
```

`ProductSummaryDto` fields: `id`, `name`, `slug`, `price`, `oldPrice`, `mainImageUrl`, `brandName`, `stockQuantity`, `active`

#### GET /api/products/{slug}

Returns full product detail.

```json
{
  "id": 1,
  "sku": "LAP-001",
  "name": "...",
  "slug": "...",
  "shortDescription": "...",
  "description": "...",
  "price": 999.99,
  "oldPrice": 1199.99,
  "stockQuantity": 10,
  "warrantyMonths": 24,
  "weight": 1.8,
  "active": true,
  "brand": { "id": 1, "name": "...", "logoUrl": "..." },
  "category": { "id": 2, "name": "Laptops", "slug": "laptops" },
  "images": [ { "id": 1, "imageUrl": "...", "sortOrder": 0, "isMain": true } ],
  "specifications": [ { "name": "CPU", "value": "Intel i7-13620H" } ],
  "relatedProducts": [ "...ProductSummaryDto x4 max..." ]
}
```

#### POST /api/orders

```json
// Request
{
  "customerName": "string",
  "customerEmail": "string",
  "customerPhone": "string",
  "deliveryAddress": "string",
  "items": [
    { "productId": 1, "quantity": 2 }
  ]
}

// Response
{
  "id": 1,
  "orderNumber": "ORD-20260613-0001"
}
```

#### GET /api/orders/{id}

Returns full `OrderDto` with all items.

---

### Admin Endpoints (ROLE_ADMIN required)

```
# Products
POST   /api/admin/products
PUT    /api/admin/products/{id}
DELETE /api/admin/products/{id}
PATCH  /api/admin/products/{id}/status     body: { "active": true }

# Categories
POST   /api/admin/categories
PUT    /api/admin/categories/{id}
DELETE /api/admin/categories/{id}

# Brands
POST   /api/admin/brands
PUT    /api/admin/brands/{id}
DELETE /api/admin/brands/{id}

# Orders
GET    /api/admin/orders                   (paginated)
PATCH  /api/admin/orders/{id}/status       body: { "status": "SHIPPED" }
```

---

## Backend Architecture

### Layered Structure

```
Controller (REST) → Service (business logic) → Repository (JPA) → DB
                          ↕
                        DTOs  (request/response, no entity leakage)
                          ↕
                     Mapper (MapStruct or manual)
```

### Key Spring Components

- `@RestController` per domain aggregate
- `@Service` with `@Transactional` for writes
- `@Repository` extending `JpaRepository` + custom `@Query` where needed
- `GlobalExceptionHandler` via `@RestControllerAdvice`
- `SecurityConfig` — permit public paths, require `ROLE_ADMIN` for `/api/admin/**`
- `SlugUtils` — utility to generate URL-safe slugs
- `OrderNumberGenerator` — generates `ORD-{date}-{sequence}`
- `ProductImporter` interface in `importer` package

---

## Folder / Project Structure

```
webshop-backend/
├── pom.xml
├── src/
│   ├── main/
│   │   ├── java/com/webshop/
│   │   │   ├── WebshopApplication.java
│   │   │   ├── config/
│   │   │   │   ├── SecurityConfig.java
│   │   │   │   └── OpenApiConfig.java
│   │   │   ├── domain/
│   │   │   │   ├── brand/
│   │   │   │   │   ├── Brand.java
│   │   │   │   │   ├── BrandRepository.java
│   │   │   │   │   ├── BrandService.java
│   │   │   │   │   ├── BrandController.java
│   │   │   │   │   ├── BrandAdminController.java
│   │   │   │   │   └── dto/
│   │   │   │   ├── category/
│   │   │   │   │   ├── Category.java
│   │   │   │   │   ├── CategoryRepository.java
│   │   │   │   │   ├── CategoryService.java
│   │   │   │   │   ├── CategoryController.java
│   │   │   │   │   ├── CategoryAdminController.java
│   │   │   │   │   └── dto/
│   │   │   │   ├── product/
│   │   │   │   │   ├── Product.java
│   │   │   │   │   ├── ProductImage.java
│   │   │   │   │   ├── ProductSpecification.java
│   │   │   │   │   ├── ProductRepository.java
│   │   │   │   │   ├── ProductService.java
│   │   │   │   │   ├── ProductController.java
│   │   │   │   │   ├── ProductAdminController.java
│   │   │   │   │   └── dto/
│   │   │   │   └── order/
│   │   │   │       ├── Order.java
│   │   │   │       ├── OrderItem.java
│   │   │   │       ├── OrderRepository.java
│   │   │   │       ├── OrderService.java
│   │   │   │       ├── OrderController.java
│   │   │   │       ├── OrderAdminController.java
│   │   │   │       └── dto/
│   │   │   ├── importer/
│   │   │   │   ├── ProductImporter.java
│   │   │   │   ├── model/
│   │   │   │   │   └── ImportProductData.java
│   │   │   │   └── impl/
│   │   │   ├── exception/
│   │   │   │   ├── GlobalExceptionHandler.java
│   │   │   │   ├── ResourceNotFoundException.java
│   │   │   │   └── BusinessException.java
│   │   │   └── util/
│   │   │       ├── SlugUtils.java
│   │   │       └── OrderNumberGenerator.java
│   │   └── resources/
│   │       ├── application.yml
│   │       └── db/migration/
│   │           ├── V1__create_brands.sql
│   │           ├── V2__create_categories.sql
│   │           ├── V3__create_products.sql
│   │           ├── V4__create_product_images.sql
│   │           ├── V5__create_product_specifications.sql
│   │           ├── V6__create_orders.sql
│   │           └── V7__create_order_items.sql
│   └── test/
│       └── java/com/webshop/
│           ├── domain/product/ProductServiceTest.java
│           ├── domain/order/OrderServiceTest.java
│           └── api/ProductControllerIT.java
```

---

## Implementation Plan

### Phase 1 — Project Bootstrap
1. Initialize Spring Boot project via Spring Initializr (Java 21, Maven)
2. Add dependencies: `spring-boot-starter-web`, `spring-boot-starter-data-jpa`, `spring-boot-starter-security`, `spring-boot-starter-validation`, `postgresql`, `flyway-core`, `lombok`, `springdoc-openapi-starter-webmvc-ui`
3. Configure `application.yml` — datasource, JPA, Flyway, security credentials
4. Write Flyway migrations V1–V7 for all tables

### Phase 2 — Domain Entities
5. Implement all JPA entities with Lombok (`@Data`, `@Builder`, `@NoArgsConstructor`)
6. Add `@PreUpdate` / `@PrePersist` for `created_at` / `updated_at`
7. Define entity relationships (`@ManyToOne`, `@OneToMany`)

### Phase 3 — Brands & Categories
8. Brand CRUD (service + public read + admin write)
9. Category CRUD + tree builder in service layer (recursive or iterative)

### Phase 4 — Products
10. Product CRUD with slug auto-generation
11. `GET /api/products` — filter by category slug, keyword search (`ILIKE`), pagination
12. `GET /api/products/{slug}` — full detail response including images, specs, related products

### Phase 5 — Orders
13. `POST /api/orders` — validate items, resolve products, snapshot name+price, generate order number, persist
14. `GET /api/orders/{id}` — public order lookup
15. Admin: list orders (paginated), update status

### Phase 6 — Security
16. Configure `SecurityConfig` — public routes, `/api/admin/**` requires `ROLE_ADMIN`
17. Use HTTP Basic for MVP admin auth with an in-memory user or a single DB admin record

### Phase 7 — Cross-Cutting Concerns
18. `GlobalExceptionHandler` — handle `ResourceNotFoundException` (404), `MethodArgumentNotValidException` (400), generic 500
19. Input validation annotations on all request DTOs (`@NotBlank`, `@Email`, `@Min`, etc.)
20. Swagger/OpenAPI config — tag grouping, descriptions

### Phase 8 — Importer Interface
21. Define `ProductImporter` interface with `importProducts()` returning `List<ImportProductData>`
22. Define `ImportProductData` DTO with all importable fields
23. Leave `impl/` package empty with `// TODO` placeholders for XmlImporter, CsvImporter, RestApiImporter

### Phase 9 — Tests
24. Unit tests: `ProductService`, `OrderService` (mock repositories)
25. Integration tests: `ProductControllerIT`, `OrderControllerIT` using `@SpringBootTest` + `MockMvc` + Testcontainers

---

## Edge Cases & Risks

| Area | Risk | Mitigation |
|---|---|---|
| Category tree | Infinite loop on circular `parent_id` | Validate parent != self on create/update; depth limit check |
| Order creation | Product out of stock | Check `stock_quantity > 0` before persisting; return 409 if insufficient |
| Product delete | Referenced by existing orders | Block hard delete if `order_items.product_id` references exist; return 409 |
| Category delete | Has children or products | Block delete, return 409 with message |
| EAN uniqueness | NULL handling in unique index | Use `CREATE UNIQUE INDEX ... WHERE ean IS NOT NULL` |
| Price snapshot | Product price changes after order | `product_price` copied to `order_item` at order time — already in model |
| Slug collision | Two products with same name | Append `-2`, `-3` suffix in `SlugUtils` if collision detected |
| Concurrent orders | Race condition on stock | Use `@Lock(PESSIMISTIC_WRITE)` on product fetch during order creation |
| Related products | Product has no category | Return empty list gracefully |
| Admin security | Hardcoded credentials in MVP | Externalize via env var / `application.yml`, never commit plaintext |
