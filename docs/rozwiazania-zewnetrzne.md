# Rozwiązania zewnętrzne użyte w RodzicPlus

Regulamin zadania, § 4 ust. 1: *„W przypadku stosowania rozwiązań zewnętrznych zostanie to wyraźnie wskazane
w prezentacji zadania.”* Poniżej pełna lista (wersje z `package-lock.json`, stan 22.11.2026) i gotowy tekst na slajd.
Wszystkie biblioteki mają licencje otwarte, zgodne z przeniesieniem praw do **naszego** kodu (MIT / ISC / Apache-2.0);
nie są naszym utworem i zostają na swoich licencjach.

## Biblioteki w aplikacji (trafiają do przeglądarki albo działają na serwerze)

| Biblioteka | Wersja | Licencja | Do czego |
|---|---|---|---|
| React, React DOM | 18.3.1 | MIT | interfejs aplikacji |
| React Router (`react-router-dom`) | 6.30.6 | MIT | adresy stron (`/wnioski`, `/kalendarz`…) |
| jsPDF | 4.2.1 | MIT | składanie PDF wniosków w przeglądarce |
| ↳ fflate, fast-png, @babel/runtime | 0.8.3 / 6.4.0 / 7.29 | MIT | zależności jsPDF (kompresja, obrazy) |
| ↳ html2canvas, canvg, DOMPurify, core-js | 1.4.1 / 3.0.11 / 3.4.18 / 3.51 | MIT; DOMPurify: MPL-2.0 lub Apache-2.0 | opcjonalne zależności jsPDF (dołączane przez bundler) |
| Express | 4.22.3 | MIT | backend – REST API (`/api/...`) |
| cors | 2.8.6 | MIT | nagłówki CORS backendu |

## Narzędzia programistyczne (nie trafiają do aplikacji)

| Narzędzie | Wersja | Licencja | Do czego |
|---|---|---|---|
| Vite + `@vitejs/plugin-react` | 5.4.21 / 4.7.0 | MIT | budowanie frontendu, serwer podglądu |
| Vitest | 2.1.9 | MIT | testy jednostkowe silnika (`npm test`) |
| `yaml` | 2.9.1 | ISC | testy spójności szablonów pism z YAML |
| Node.js | 22 (obraz `node:22-alpine`) | MIT | środowisko uruchomieniowe |
| Python 3 + PyYAML | – | PSF / MIT | `latex/gen_latex.py` – generowanie szablonów LaTeX z YAML |
| Tectonic / XeLaTeX | – | MIT / LPPL | kompilacja szablonów pism `latex/*.tex` do PDF |

## Czcionki

| Czcionka | Licencja | Gdzie |
|---|---|---|
| DejaVu Sans (zwykła i pogrubiona) | Bitstream Vera / DejaVu (wolna) – plik `frontend/public/fonts/LICENSE-DejaVu.txt` | PDF wniosków (polskie znaki w jsPDF) |
| Latin Modern | GUST Font License | szablony LaTeX (dostarcza Tectonic) |

## Infrastruktura i usługi

| Usługa | Do czego |
|---|---|
| Docker / Docker Compose | uruchamianie frontendu i backendu (`docker compose up --build`) |
| GitHub + GitHub Actions (`actions/checkout`, `actions/setup-node`, `google-github-actions/auth`, `setup-gcloud`) | repozytorium, testy i deploy po każdym pushu na `main` |
| Google Cloud (Artifact Registry, Compute Engine) | hosting wersji demonstracyjnej |

## Treści i dane zewnętrzne

| Źródło | Jak użyte |
|---|---|
| Kodeks pracy, ustawa zasiłkowa, rozporządzenia z 11.03.2025 i 27.09.2026 | reguły, terminy i treść wniosków w silniku (`frontend/src/engine`) – akty prawne nie są chronione prawem autorskim |
| Materiały ZUS do zadania (treść zadania, załącznik, poradnik ZUS 2026) | podstawa merytoryczna i weryfikacja liczb; **przykładowych spraw ZUS nie ma w repozytorium** (`private-cases/` w `.gitignore`), zgodnie z zakazem kopiowania z treści zadania |
| Strony organizacji pomocowych (strona „Wsparcie”) | tylko nazwy, krótki opis i link do ich stron |

Usługi „ZUS / PUE / eZUS”, „mObywatel” i „USC” są w aplikacji **wyłącznie symulowane** (dane fikcyjne) – nie łączymy się z żadnym systemem państwowym.

---

## Tekst na slajd „Rozwiązania zewnętrzne” (do wklejenia)

> **Rozwiązania zewnętrzne (regulamin § 4 ust. 1)**
> - Frontend: React 18, React Router 6, jsPDF 4 (PDF wniosków; czcionka DejaVu Sans) – licencje MIT
> - Backend: Node.js 22, Express 4, cors – MIT
> - Narzędzia: Vite, Vitest, yaml; szablony pism: Python + XeLaTeX/Tectonic
> - Infrastruktura: Docker, GitHub Actions, Google Cloud
> - Dane: przepisy prawa i materiały ZUS do zadania; integracje ZUS / mObywatel / USC tylko symulowane
> - Cały kod aplikacji, silnik reguł i testy – nasz zespół
