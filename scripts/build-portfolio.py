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
      <img src="{e(item.get('preview') or item['src'])}" alt="{e(item['alt'])}" width="{int(item['width'])}" height="{int(item['height'])}" loading="lazy" decoding="async">
      <span>{e(label)} {icon('expand')}</span></a>'''


def audio_player(audio):
    label = f"Аудиоотзыв: {audio['name']}, {audio['project']}"
    return f'''<div class="audio-review"><div class="audio-heading"><span>Аудиоотзыв</span><span>{e(audio['duration'])}</span></div>
      <audio controls preload="none" aria-label="{e(label)}" src="{e(audio['src'])}">Ваш браузер не поддерживает аудио.</audio>
      <a class="audio-download" href="{e(audio['src'])}" download>Скачать аудио</a></div>'''


def video_link(video, project):
    poster = ""
    if video.get("poster"):
        poster = f'<img class="video-poster" src="{e(video["poster"])}" alt="" width="{int(video.get("width", 640))}" height="{int(video.get("height", 360))}" loading="lazy">'
    local = f' data-local-video="{e(video["local"])}" data-poster="{e(video.get("poster") or "")}" data-vk-url="{e(video["url"])}"' if video.get('local') else ''
    return f'''<a class="video-launch" href="{e(video.get('local') or video['url'])}" data-video="{e(video['embed'])}"{local} data-title="{e('Видеоотзыв: ' + video['name'] + ', ' + project)}">
      {poster}<span class="play-symbol">{icon('play')}</span><span class="video-label"><strong>Смотреть видеоотзыв</strong><span>{e(video['name'])} · {e(project)}</span></span>{icon('arrow')}</a>'''


def numbers(case):
    return f'''<dl class="case-numbers"><div><dt>{e(case['leadLabel'])}</dt><dd>{case['leads']}</dd></div>
      <div><dt>{e(case['costLabel'])}</dt><dd>{e(case['cost'])}<span> ₽</span></dd></div></dl>'''


def ledger(case):
    return f'''<div class="case-ledger"><p>Расход на рекламу <strong>{e(case['spend'])} ₽</strong></p><p>{e(case['sourceNote'])}</p></div>'''


def case_card(case):
    cid = case["id"]
    media = ""
    if case.get("video"):
        media += video_link(case["video"], case["name"])
    if case.get("audio"):
        media += audio_player(case["audio"])
    if case.get("review"):
        review = case["review"]
        media += f'<div class="case-chat"><p>Переписка · {e(review["name"])}</p>{image_link(review["image"], "Открыть переписку")}</div>'
    proof = ''.join(image_link(item, 'Увеличить скриншот') for item in case['evidence'])
    return f'''<article class="case-card" id="{cid}" aria-labelledby="{cid}-title">
      <div class="case-info"><h3 id="{cid}-title">{e(case['name'])}</h3><p class="case-kind">{e(case['kind'])}<br>{e(case['location'])}</p>
      <p class="case-period">{e(case['period'])}</p>{numbers(case)}{ledger(case)}{media}</div>
      <div class="case-report"><p>Рекламный кабинет</p>{proof}</div>
    </article>'''


def testimonial(item):
    project = f'<p>{e(item["project"])}</p>' if item.get('project') else ''
    return f'''<li class="testimonial" id="review-{e(item['id'])}"><div class="review-person"><h3>{e(item['name'])}</h3>{project}</div>{image_link(item['image'], 'Открыть переписку')}</li>'''


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
        <div class="case-list">{''.join(case_card(case) for case in DATA['cases'])}</div>
        <section class="testimonials" aria-labelledby="testimonials-title">
          <div class="testimonials-heading"><h2 id="testimonials-title">Отзывы клиентов</h2></div>
          <div class="standalone-audio"><div class="review-person"><h3>Мария</h3><p>Лагерь «Чайка»</p></div>{audio_player(next(x['audio'] for x in DATA['testimonials'] if x.get('audio')))}</div>
          <ul class="testimonials-grid">{''.join(testimonial(x) for x in DATA['testimonials'] if x.get('image'))}</ul>
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
