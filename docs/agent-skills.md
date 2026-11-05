# Локальные Skills для Codex

Оба Skills установлены в `.agents/skills/` этого репозитория. Глобальные Skills и настройки Codex не менялись. После открытия новой сессии из корня репозитория используйте `$ui-ux-pro-max` и `$impeccable`; список доступен через `/skills`.

## Источники и установка

- UI UX Pro Max: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill, npm `ui-ux-pro-max-cli@2.15.0`.
- Impeccable: https://github.com/pbakaus/impeccable, npm `impeccable@4.8.0`, engine `0.1.18`. Файлы Skill взяты из официального commit `c8891a9ae865d6ee311836ae5199bfce0fe115b1`.

Из корня проекта выполнены официальные установщики:

```sh
npx ui-ux-pro-max-cli init --ai codex
npx impeccable install --providers=codex --scope=project --no-hooks
```

Первый запрос Impeccable к `https://impeccable.style/api/download/bundle/universal` был заблокирован прокси (403). Установка завершена тем же CLI через поддерживаемый `IMPECCABLE_BUNDLE_PATH`: в отдельный временный каталог скопирована `.agents` из указанного официального GitHub checkout. Проверка TLS сохранена; движок установщик скачал с GitHub Releases и проверил по SHA-256 из `engine-checksums.txt`. Это локальная установка из исходников, а не успешная загрузка заблокированного bundle.

Для воспроизведения резервного пути подготовьте официальный checkout на указанном commit вне проекта, скопируйте его `.agents` в отдельный каталог bundle и выполните:

```sh
IMPECCABLE_BUNDLE_PATH=/absolute/path/to/bundle npx impeccable@4.8.0 install --providers=codex --scope=project --no-hooks
```

UI UX Pro Max поставляет также `banner-design`, `brand`, `design`, `design-system`, `slides` и `ui-styling`; они сохранены вместе с их справочниками, данными и скриптами.

## Проверка

В текущей среде доступны Python 3.12.14 и Node.js 24.22.1. Проверены поиск UI UX Pro Max по локальной CSV-базе и генерация дизайн-системы без записи результата в проект:

```sh
PYTHONDONTWRITEBYTECODE=1 python3 .agents/skills/ui-ux-pro-max/scripts/search.py 'accessible responsive typography' --domain ux -n 2
PYTHONDONTWRITEBYTECODE=1 python3 .agents/skills/ui-ux-pro-max/scripts/search.py 'software dashboard' --design-system
.agents/skills/impeccable/scripts/impeccable engine-probe
.agents/skills/impeccable/scripts/impeccable detect --list-rules
.agents/skills/impeccable/scripts/impeccable doctor
```

Codex app-server `skills/list` с `cwds=[корень проекта]` и `forceReload=true` распознал оба Skills как `scope=repo`, `enabled=true`, без ошибок. Это проверка загрузчика Codex, а не только наличия файлов.

Бинарник Impeccable находится в игнорируемом `scripts/bin/`, в Git не включён. На другой машине launcher при необходимости скачает движок с GitHub Releases с проверкой checksum. npm-кэш и проверочные файлы хранятся вне репозитория. Полный перечень добавленных файлов: [agent-skills-files.txt](agent-skills-files.txt).

## Hooks и ограничения

Hooks не установлены и не одобрены. Для автоматической проверки после каждого изменения Impeccable предлагает design hook; его подключение — отдельное действие с проверкой кода и доверием через `/hooks` в Codex. Ручные `critique`, `audit`, `polish` и CLI detector доступны без hook.

Live mode по умолчанию способен вызвать отдельный CLI с отключёнными sandbox и approvals. Перед любым явно запрошенным запуском live задавайте `IMPECCABLE_LIVE_COPY_AGENT=chat` или `off`; не используйте автоматический fallback. Live, инициализация PRODUCT.md, разработка сайта и визуальная проверка сайта в рамках установки не выполнялись.

Сетевой доступ к `impeccable.style` нужен для штатного обновления и отдельных онлайн-возможностей. `api.github.com` нужен для создания PR через GitHub CLI. Эти домены предложены в черновике настроек среды; сохранение черновика само по себе не меняет действующую сеть.
