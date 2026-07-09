# Changelog

Sve značajne promene na projektu su dokumentovane ovde.

Format prati [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
a verzionisanje prati [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-07-09

Inicijalna produkcijska verzija Optimus webshop frontenda.

### Stranice

- `index.html` — početna sa hero sekcijom, novim proizvodima, bestsajlerima i brendovima karuselom
- `store.html` — listing proizvoda sa filterima po kategoriji, brendu i ceni
- `product.html` — detalj proizvoda sa galerijom, specifikacijama, recenzijama i QR share
- `cart.html` — korpa sa kalkulacijom ukupne cene
- `checkout.html` — forma za porudžbinu
- `order-confirmation.html` — potvrda porudžbine sa detaljima
- `wishlist.html` — lista želja
- `compare.html` — tabelarno poređenje proizvoda
- `about.html` — o nama
- `contact.html` — kontakt forma
- `404.html` / `500.html` — error stranice
- `under-construction.html` — placeholder za stranice u izgradnji
- Admin panel (`admin/`) — dashboard, upravljanje proizvodima, kategorijama, brendovima, porudžbinama i uvozom

### Funkcionalnosti

- Dinamički meni učitan iz API-ja (`main-nav.js`)
- Live pretraga u headeru (`header-search.js`)
- Korpa sa localStorage persistencom i header dropdownom (`cart.js`)
- Lista želja sa localStorage persistencom (`wishlist.js`)
- Poređenje proizvoda (`compare.js`)
- Quick View Modal za brzi pregled proizvoda bez napuštanja listinga
- Recenzije proizvoda sa paginacijom i sumarom ocena
- QR kod deljenje stranice proizvoda
- God kategorije — mega menu sidebar sa hijerarhijom kategorija
- Moderan filter brendova sa checkbox UI
- Moderan price range filter sa noUiSlider i preset opcijama
- Karusel brendova sa Slick sliderom
- Dinamički bestsajleri i novi proizvodi učitani iz API-ja
- Checkout tok sa provjerom stanja korpe
- Admin: bulk update statusa proizvoda, paginacija, filter po stanju zalihe
- Admin: uvoz proizvoda sa historijom jobova
- Admin: upravljanje god kategorijama i display imenima
- Admin: detalj i upravljanje statusom porudžbina
- Soft paginacija sa elipsom i disabled state stilizacijom
- Srpska lokalizacija celokupnog UI-ja

### Tehnički

- API_BASE auto-detekcija dev/prod okruženja (`config.js`)
- Sve CSS/JS u eksternim fajlovima — nema inline `<style>` ili `<script>` blokova u produkcijskim stranicama
- Zajednički `page-hero.css` deljenim između svih stranica sa hero bannerom
- SVG logo umesto PNG
- Favicon set (ICO, PNG 16/32, Apple Touch Icon, WebManifest)
- Deploy na GitHub Pages + backend na Google Cloud Run (europe-west1)
- `README.md` i `architecture-spec.md` dokumentacija

---

## Kako dodati novu verziju

```bash
# 1. Commitovati sve promene
git add .
git commit -m "feat: opis promene"

# 2. Ažurirati CHANGELOG.md (dodati novi ## [X.Y.Z] blok na vrh)

# 3. Tagirati
git tag -a v1.1.0 -m "Kratak opis šta je novo"
git push origin main
git push origin v1.1.0
```

### Konvencija verzija

| Situacija | Promena |
|---|---|
| Redizajn, breaking promene | `MAJOR` → v2.0.0 |
| Nova stranica ili funkcionalnost | `MINOR` → v1.1.0 |
| Bugfix, korekcija teksta, sitni stil | `PATCH` → v1.0.1 |
