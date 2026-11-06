#!/usr/bin/env python3
"""Render the portfolio only. GitHub Pages serves the committed HTML without a build."""
import json
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = json.loads((ROOT / "data/portfolio.json").read_text())
START = "<!-- portfolio:start -->"
END = "<!-- portfolio:end -->"


def e(value):
    return escape(str(value), quote=True)


def icon(name):
    shapes = {
        "arrow": '<path d="M5 12h14m-6-6 6 6-6 6"/>',
        "play": '<path d="m9 5 11 7-11 7V5Z"/>',
        "expand": '<path d="M9 4H4v5m11-5h5v5M4 15v5h5m11-5v5h-5"/>',
        "close": '<path d="m6 6 12 12M6 18 18 6"/>',
    }
    return f'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{shapes[name]}</svg>'


def image_link(item, label):
    # Images are added only after their real files are supplied. Never invent paths.
    if not item:
        return ""
    return f'''<a class="proof-image" href="{e(item['src'])}" data-image data-caption="{e(item['alt'])}">
      <img src="{e(item['src'])}" alt="{e(item['alt'])}" width="{int(item['width'])}" height="{int(item['height'])}" loading="lazy" decoding="async">
      <span>{e(label)} {icon('expand')}</span></a>'''


def audio_player(audio):
    label = f"Аудиоотзыв: {audio['name']}, {audio['project']}"
    return f'''<div class="audio-review"><div class="audio-heading"><span>Аудиоотзыв</span><span>{e(audio['duration'])}</span></div>
      <audio controls preload="none" aria-label="{e(label)}" src="{e(audio['src'])}">Ваш браузер не поддерживает аудио.</audio>
      <a class="audio-download" href="{e(audio['src'])}" download>Скачать аудио</a></div>'''


def video_link(video, project):
    poster = ""
    if video.get("poster"):
        poster = f'<img class="video-poster" src="{e(video["poster"])}" alt="" width="640" height="360" loading="lazy">'
    return f'''<a class="video-launch" href="{e(video['url'])}" data-video="{e(video['embed'])}" data-title="{e('Видеоотзыв: ' + video['name'] + ', ' + project)}">
      {poster}<span class="play-symbol">{icon('play')}</span><span class="video-label"><strong>Смотреть видеоотзыв</strong><span>{e(video['name'])} · {e(project)}</span></span>{icon('arrow')}</a>'''


def quote(review):
    context = f'<p class="quote-context">{e(review["context"])}</p>' if review.get("context") else ""
    return f'''<blockquote><p>«{e(review['quote'])}»</p><footer><strong>{e(review['name'])}</strong><span>{e(review.get('project') or 'Из переписки с клиентом')}</span></footer></blockquote>{context}{image_link(review.get('image'), 'Открыть переписку')}'''


def numbers(case, compact=False):
    return f'''<dl class="case-numbers"><div><dt>{e(case['leadLabel'])}</dt><dd>{case['leads']}</dd></div>
      <div><dt>{e(case['costLabel'])}</dt><dd>{e(case['cost'])}<span> ₽</span></dd></div></dl>'''


def ledger(case):
    return f'''<div class="case-ledger"><p>Расход на рекламу <strong>{e(case['spend'])} ₽</strong></p><p>{e(case['sourceNote'])}</p></div>'''


def feature(case, index):
    cid = case["id"]
    panels = [("result", "Результат", numbers(case) + ledger(case))]
    if case["evidence"]:
        panels.append(("evidence", "Доказательства", ''.join(image_link(x, 'Открыть скриншот') for x in case["evidence"])))
    review = ""
    if case.get("video"):
        review += video_link(case["video"], case["name"])
    if case.get("audio"):
        review += audio_player(case["audio"])
    if case.get("review"):
        review += quote(case["review"])
    panels.append(("review", "Отзыв", review))
    tabs = ''.join(f'<button type="button" id="{cid}-tab-{key}" data-panel="{cid}-{key}">{label}</button>' for key, label, _ in panels)
    content = ''.join(f'<div class="case-panel" id="{cid}-{key}" data-case-panel><h4 class="panel-heading">{label}</h4>{body}</div>' for key, label, body in panels)
    preview = f'''<a class="case-review-jump" href="#{cid}-review" data-review-jump="{cid}-tab-review">{'Видео и аудио клиента' if case.get('audio') else 'Видеоотзыв клиента' if case.get('video') else 'Отзыв из переписки'} {icon('arrow')}</a>'''
    return f'''<article class="case-feature case-feature--{index}" id="{cid}" aria-labelledby="{cid}-title">
      <div class="case-intro"><h3 id="{cid}-title">{e(case['name'])}</h3><p class="case-kind">{e(case['kind'])}<br>{e(case['location'])}</p>
      <p class="case-description">{e(case['description'])}</p><p class="case-period">{e(case['period'])}</p>{preview}</div>
      <div class="case-workspace" data-case-tabs><div class="case-tabs" aria-label="Материалы: {e(case['name'])}" hidden>{tabs}</div>{content}</div>
    </article>'''


def quote_case(case):
    cid = case["id"]
    evidence = ''.join(image_link(x, 'Открыть скриншот') for x in case['evidence'])
    return f'''<article class="case-quote" id="{cid}" aria-labelledby="{cid}-title">
      <header class="case-quote-header"><div><h3 id="{cid}-title">{e(case['name'])}</h3><p class="case-kind">{e(case['kind'])} · {e(case['location'])}</p></div><p class="case-period">{e(case['period'])}</p></header>
      <div class="case-quote-body"><div class="case-quote-results">{numbers(case)}{ledger(case)}{evidence}</div><div class="case-quote-review" id="{cid}-review">{quote(case['review'])}</div></div>
    </article>'''


def compact(case):
    cid = case["id"]
    evidence = ''.join(image_link(x, 'Открыть скриншот') for x in case["evidence"])
    return f'''<article class="case-compact" id="{cid}" aria-labelledby="{cid}-title"><h3 id="{cid}-title">{e(case['name'])}</h3>
      <p class="case-kind">{e(case['kind'])}<br>{e(case['location'])} · {e(case['period'])}</p>{numbers(case, True)}
      <details class="case-details"><summary>Данные кампании {icon('expand')}</summary>{ledger(case)}{evidence}</details></article>'''


def testimonial(item):
    if item.get("audio"):
        body = f'<div class="audio-person"><h3>{e(item["name"])}</h3><p>{e(item["project"])}</p></div>{audio_player(item["audio"])}'
    else:
        body = quote(item)
    if item.get("caseId"):
        body += f'<a class="text-link" href="#{e(item["caseId"])}">Кейс этого клиента {icon("arrow")}</a>'
    return f'<li class="testimonial" id="review-{e(item["id"])}">{body}</li>'


nav = ''.join(f'<a href="#{case["id"]}">{e(case["name"] if case["id"] != "konoplev" else "Коноплёва")}</a>' for case in DATA["cases"])
html = f'''{START}
      <section class="portfolio page-width" id="cases" aria-labelledby="portfolio-title">
        <header class="portfolio-intro">
          <h2 id="portfolio-title">Я знаю, как заинтересовать родителей.<br><span>И могу подтвердить это результатами.</span></h2>
          <div class="portfolio-context"><p>С 2019 года занимаюсь интернет-маркетингом. Одно из основных направлений — детские проекты. За эти годы хорошо изучил родительскую аудиторию: её потребности и то, как она принимает решения.</p>
          <ol class="approach"><li><strong>Реклама</strong><span>Привлекаем заинтересованных родителей</span></li><li><strong>Запись</strong><span>Помогаем довести обращение до занятия</span></li><li><strong>Аналитика</strong><span>Считаем стоимость фактического посещения</span></li></ol></div>
        </header>
        <div class="portfolio-heading"><h2>Опыт в детских проектах</h2><p>Ниже — результаты продвижения детских проектов, преимущественно лагерей. Цифры показывают заявки и обращения, а не продажи или посещения занятий.</p></div>
        <nav class="case-index" aria-label="Перейти к кейсу">{nav}</nav>
        <div class="featured-cases">{''.join(feature(case, i + 1) for i, case in enumerate(DATA['cases'][:2]))}{quote_case(DATA['cases'][2])}</div>
        <div class="compact-cases">{''.join(compact(case) for case in DATA['cases'][3:])}</div>
        <section class="testimonials" aria-labelledby="testimonials-title">
          <div class="testimonials-heading"><div><h2 id="testimonials-title">Когда за работу говорят клиенты</h2><p>Ещё несколько отзывов и сообщений из переписок.</p></div>
          <div class="gallery-controls" hidden><button type="button" data-gallery-prev aria-label="Предыдущие отзывы" aria-controls="testimonials-list">{icon('arrow')}</button><button type="button" data-gallery-next aria-label="Следующие отзывы" aria-controls="testimonials-list">{icon('arrow')}</button></div></div>
          <ul class="testimonials-track" id="testimonials-list" tabindex="0" aria-label="Галерея отзывов">{''.join(testimonial(x) for x in DATA['testimonials'])}</ul>
        </section>
        <a class="portfolio-outro" href="https://vk.ru/reklama_lager"><span>Больше проектов и отзывов —<br> в моём VK-сообществе</span>{icon('arrow')}</a>
      </section>
      <dialog class="media-dialog" aria-labelledby="media-title"><div class="media-dialog-header"><h2 id="media-title">Просмотр материала</h2><form method="dialog"><button type="submit" aria-label="Закрыть просмотр">Закрыть {icon('close')}</button></form></div><div id="media-content"></div></dialog>
      {END}'''
path = ROOT / "index.html"
page = path.read_text()
if START in page:
    before, rest = page.split(START, 1)
    _, after = rest.split(END, 1)
    page = before + html + after
else:
    page = page.replace('<!-- Только Hero. Будущие разделы, включая #cases, добавляются отдельно. -->', html)
path.write_text(page)
print("Portfolio rendered: 5 cases, 5 additional reviews.")
