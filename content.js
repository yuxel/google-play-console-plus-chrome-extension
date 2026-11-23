/* Play Console Plus — content script */
(() => {
  if (window.__pcpLoaded) return;
  window.__pcpLoaded = true;

  // ---------- storage (chrome.storage with in-memory fallback) ----------
  const mem = {};
  const store = {
    async get(k) {
      try { if (chrome?.storage?.local) return (await chrome.storage.local.get(k))[k]; } catch (e) {}
      return mem[k];
    },
    async set(k, v) {
      try { if (chrome?.storage?.local) return chrome.storage.local.set({ [k]: v }); } catch (e) {}
      mem[k] = v;
    },
    async getSync(k) {
      try { if (chrome?.storage?.sync) { const v = (await chrome.storage.sync.get(k))[k]; if (v !== undefined) return v; } } catch (e) {}
      return this.get(k);
    },
    async setSync(k, v) {
      try { if (chrome?.storage?.sync) { await chrome.storage.sync.set({ [k]: v }); return; } } catch (e) {}
      return this.set(k, v);
    },
  };

  // ---------- helpers ----------
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const txt = (e) => (e ? e.innerText.replace(/\s+/g, ' ').trim() : '');
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = (s) => String(s).toLocaleLowerCase('tr').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i');
  const devId = () => (location.pathname.match(/\/developers\/(\d+)/) || [])[1];
  const base = () => { const m = location.pathname.match(/^(\/console\/u\/\d+\/developers\/\d+)/); return m ? m[1] : null; };
  const isHome = () => /\/developers\/\d+\/?(home)?\/?$/.test(location.pathname);

  // ---------- i18n ----------
  const I18N = {
    tr: {
      sec_dash: 'Kontrol paneli', sec_stats: 'İstatistikler', sec_rel: 'Sürümler', sec_prod: 'Üretim kanalı', sec_int: 'Dahili test',
      sec_closed: 'Kapalı test', sec_pub: 'Yayınlama özeti', sec_store: 'Mağaza girişleri', sec_reviews: 'Yorumlar', sec_ratings: 'Puanlar',
      sec_vitals: 'Android vitals', sec_crashes: 'Kilitlenmeler ve ANR', sec_policy: 'Politika durumu', sec_content: 'Uygulama içeriği',
      sec_acq: 'Mağaza analizi', sec_iap: 'Uygulama içi ürünler', sec_subs: 'Abonelikler', sec_rev: 'Gelir',
      short_stats: 'İstatistikler', short_rel: 'Sürümler', short_store: 'Mağaza', short_reviews: 'Yorumlar', short_vitals: 'Vitals', short_policy: 'Politika',
      ungrouped: 'Grupsuz', newGroupPrompt: 'Yeni grup adı:', groupNamePrompt: 'Grup adı:',
      deleteGroupConfirm: '"{0}" grubu silinsin mi? Uygulamalar silinmez, "Grupsuz"a geçer.',
      staleTitle: 'Play Console bu satırın verisini zamanında yüklemedi; son bilinen değerler gösteriliyor. ↻ ile yenile.', stale: '⟲ önceki veri',
      freeTitle: 'Ücretsiz uygulama', free: 'ücretsiz',
      moveUp: 'Yukarı taşı', moveDown: 'Aşağı taşı', rename: 'Yeniden adlandır', deleteGroup: 'Grubu sil',
      groupStats: '{0} uygulama · yükleme {1} · MAD {2}', groupRevenue: ' · gelir {0}', nActions: '{0} aksiyon',
      groupEmpty: 'Bu grup boş — uygulamaları buraya sürükle ya da seçip taşı.',
      search: 'Uygulama ara…', all: 'Tümü', live: 'Yayında', test: 'Test', action: 'Aksiyon',
      loading: 'Yükleniyor…', loadingN: 'Yükleniyor {0}/{1}…', updated: 'Güncellendi {0}',
      customOrderTitle: 'Satırları sürükleyerek kendi sıranı oluştur', customOrder: '⇅ Özel sıra', addGroup: '+ Grup',
      collapseAll: 'Tüm grupları daralt / genişlet', refresh: 'Yenile', darkTheme: 'Karanlık tema', language: 'Dil / Language',
      notifications: 'Bildirimler', nWaiting: '{0} uygulama aksiyon bekliyor', allGood: 'Her şey yolunda 🎉',
      origTitle: "Play Console'un orijinal görünümüne dön (Esc)", orig: 'Orijinal görünüm',
      cApps: 'Uygulama', cLive: '{0} yayında', cAction: 'Aksiyon gerekli', cActionSub: 'politika, ret, ANR, gönderilmemiş', showNotifs: 'Bildirimleri göster',
      cInstalls: 'Yükleme', cMad: 'Aylık aktif cihaz', total: 'toplam', cRevenue: 'Gelir',
      nSelected: '{0} seçili', moveTo: 'Gruba taşı:', choose: 'Seç…', newGroupOpt: '+ Yeni grup…', move: 'Taşı', ungroup: 'Gruptan çıkar', clearSel: 'Seçimi temizle',
      selAll: 'Görünenlerin hepsini seç', hApp: 'Uygulama', hState: 'Durum', hIssues: 'Uyarılar', hInstalls: 'Yükleme', hNew28: 'İlk yükleme', tipNew28: 'İlk yükleme: Son 28 günde uygulamanın daha önce hiç yüklenmediği cihazlara yapılan yüklemeler (yeni cihaz edinme).', tipRevLife: 'Gelir (tüm zamanlar): Finansal raporlar > Gelir sayfasındaki “Lifetime” toplamı (abonelik + tek seferlik ürünler, brüt).', revLifeSub: 'tüm zamanlar · brüt', hRevenue: 'Gelir', hUpdated: 'Güncelleme', hLinks: 'Kısayollar',
      noMatch: 'Eşleşen uygulama yok.',
      foot: '<kbd>{K}</kbd> hızlı gezinme · <kbd>Esc</kbd> kapat · Satırları sürükle: başka satırın üstüne → sırala, grup başlığına → gruba taşı · Gruplar Chrome hesabınla senkronlanır',
      palHome: 'Ana sayfa (tüm uygulamalar)', palPanel: 'Play Console Plus görünümünü aç', palDark: 'Karanlık temayı aç/kapat', palLang: 'Dili değiştir (English)',
      palPlaceholder: 'Uygulama veya bölüm… (ör. fedai yorum)', palHint: '↑↓ seç · Enter git · {M}+Enter yeni sekme · Esc kapat',
      palNoApps: ' · Uygulama listesi için önce Play Console ana sayfasını bir kez aç', noResults: 'Sonuç yok',
      fabTitle: 'Play Console Plus görünümüne geç', fab: '▦ Plus görünüm', quickNav: 'Hızlı gezinme ({K})',
      period: 'Son {0} gün',
      fetchedTip: 'Bu satırın verisi {0} saatinde elle, İstatistikler ve Gelir sayfalarından çekildi.',
      fetchSel: 'Verisini çek ({0})', fetchSelTip: 'Seçili uygulamaların verisini Play Console istatistik ve gelir sayfalarından yeniden okur. Sadece şu anki görünüm için gereken veri çekilir.', failTip: 'Play Console bu veriyi zamanında vermedi. Uygulamayı seçip “Verisini çek” ile tekrar dene.', fromStats: 'Ana sayfada gelmedi; İstatistikler sayfasından alındı.',
      p28: 'Son 28 gün', pLife: 'Tüm zamanlar', lifeLoading: 'Veri çekiliyor {0}/{1}…', lifeUpdated: 'Tüm zaman verisi: {0}',
      hLifeAll: 'Toplam yükleme', hLifeNew: 'İlk yükleme', hSince: 'Veri başlangıcı', cLifeAll: 'Toplam yükleme', cLifeSub: 'tüm zamanlar · {0} uygulama',
      groupStatsLife: '{0} uygulama · toplam yükleme {1} · MAD {2}', lifeRefresh: 'Tüm zaman verisini yeniden çek', lifeErr: 'yüklenemedi',
      tipInstalls: 'Yükleme: Son 28 günde uygulamanın yüklendiği cihaz sayısı. Play Console bu metriğe “cihaz edinme (device acquisitions)” diyor; yeniden yüklemeler dahil.',
      tipDelta: 'Bir önceki aynı uzunluktaki döneme göre değişim.',
      tipMad: 'MAD (Monthly Active Devices / Aylık aktif cihaz): Uygulamanın kurulu olduğu ve son 30 günde aktif olan benzersiz cihaz sayısı. Kaç cihazda gerçekten yaşadığını gösterir.',
      tipRevenue: 'Gelir: Son 28 günde uygulama içi satın alma ve ücretli indirme geliri (Play kesintisi öncesi tahmini).',
      tipLifeAll: 'Toplam yükleme: Play Console istatistiklerindeki tüm “cihaz edinme” sayılarının toplamı. Aynı cihaza yeniden yüklemeler de sayılır.',
      tipLifeNew: 'İlk yükleme: Uygulamanın daha önce hiç yüklenmediği cihazlara yapılan yüklemeler (yeni cihaz edinme). Benzersiz yükleme sayısına en yakın metrik.',
      tipSince: 'Play Console bu metriğin verisini bu aydan itibaren veriyor. Daha eski yüklemeler toplamda yer almaz.',
    },
    en: {
      sec_dash: 'Dashboard', sec_stats: 'Statistics', sec_rel: 'Releases', sec_prod: 'Production track', sec_int: 'Internal testing',
      sec_closed: 'Closed testing', sec_pub: 'Publishing overview', sec_store: 'Store listings', sec_reviews: 'Reviews', sec_ratings: 'Ratings',
      sec_vitals: 'Android vitals', sec_crashes: 'Crashes and ANRs', sec_policy: 'Policy status', sec_content: 'App content',
      sec_acq: 'Store analysis', sec_iap: 'In-app products', sec_subs: 'Subscriptions', sec_rev: 'Revenue',
      short_stats: 'Stats', short_rel: 'Releases', short_store: 'Store', short_reviews: 'Reviews', short_vitals: 'Vitals', short_policy: 'Policy',
      ungrouped: 'Ungrouped', newGroupPrompt: 'New group name:', groupNamePrompt: 'Group name:',
      deleteGroupConfirm: 'Delete group "{0}"? Apps are not deleted; they move to "Ungrouped".',
      staleTitle: 'Play Console did not load this row in time; showing the last known values. Press ↻ to refresh.', stale: '⟲ previous data',
      freeTitle: 'Free app', free: 'free',
      moveUp: 'Move up', moveDown: 'Move down', rename: 'Rename', deleteGroup: 'Delete group',
      groupStats: '{0} apps · installs {1} · MAD {2}', groupRevenue: ' · revenue {0}', nActions: '{0} need action',
      groupEmpty: 'This group is empty — drag apps here or select them and move.',
      search: 'Search apps…', all: 'All', live: 'Live', test: 'Testing', action: 'Action',
      loading: 'Loading…', loadingN: 'Loading {0}/{1}…', updated: 'Updated {0}',
      customOrderTitle: 'Drag rows to create your own order', customOrder: '⇅ Custom order', addGroup: '+ Group',
      collapseAll: 'Collapse / expand all groups', refresh: 'Refresh', darkTheme: 'Dark theme', language: 'Dil / Language',
      notifications: 'Notifications', nWaiting: '{0} apps need action', allGood: 'All good 🎉',
      origTitle: 'Back to the original Play Console view (Esc)', orig: 'Original view',
      cApps: 'Apps', cLive: '{0} live', cAction: 'Needs action', cActionSub: 'policy, rejections, ANR, unsent', showNotifs: 'Show notifications',
      cInstalls: 'Installs', cMad: 'Monthly active devices', total: 'total', cRevenue: 'Revenue',
      nSelected: '{0} selected', moveTo: 'Move to group:', choose: 'Choose…', newGroupOpt: '+ New group…', move: 'Move', ungroup: 'Remove from group', clearSel: 'Clear selection',
      selAll: 'Select all visible', hApp: 'App', hState: 'Status', hIssues: 'Alerts', hInstalls: 'Installs', hNew28: 'First installs', tipNew28: 'First installs: installs in the last 28 days on devices that never had the app before (new device acquisitions).', tipRevLife: 'Revenue (all time): the “Lifetime” total on Financial reports > Revenue (subscriptions + one-time products, gross).', revLifeSub: 'all time · gross', hRevenue: 'Revenue', hUpdated: 'Updated', hLinks: 'Shortcuts',
      noMatch: 'No matching apps.',
      foot: '<kbd>{K}</kbd> quick navigation · <kbd>Esc</kbd> close · Drag rows: onto another row → reorder, onto a group header → move to group · Groups sync with your Chrome account',
      palHome: 'Home (all apps)', palPanel: 'Open Play Console Plus view', palDark: 'Toggle dark theme', palLang: 'Switch language (Türkçe)',
      palPlaceholder: 'App or section… (e.g. fedai reviews)', palHint: '↑↓ select · Enter go · {M}+Enter new tab · Esc close',
      palNoApps: ' · Open the Play Console home page once to load your apps', noResults: 'No results',
      fabTitle: 'Switch to Play Console Plus view', fab: '▦ Plus view', quickNav: 'Quick navigation ({K})',
      period: 'Last {0} days',
      fetchedTip: 'This row was fetched manually at {0} from the Statistics and Revenue pages.',
      fetchSel: 'Fetch data ({0})', fetchSelTip: 'Re-reads the selected apps from the Play Console statistics and revenue pages. Only the data the current view needs is fetched.', failTip: 'Play Console did not return this data in time. Select the app and press “Fetch data” to retry.', fromStats: 'Missing on the home page; taken from the Statistics page.',
      p28: 'Last 28 days', pLife: 'All time', lifeLoading: 'Fetching data {0}/{1}…', lifeUpdated: 'All-time data: {0}',
      hLifeAll: 'Total installs', hLifeNew: 'First installs', hSince: 'Data since', cLifeAll: 'Total installs', cLifeSub: 'all time · {0} apps',
      groupStatsLife: '{0} apps · total installs {1} · MAD {2}', lifeRefresh: 'Reload all-time data', lifeErr: 'failed',
      tipInstalls: 'Installs: devices your app was installed on in the last 28 days. Play Console calls this “device acquisitions”; reinstalls are included.',
      tipDelta: 'Change versus the previous period of the same length.',
      tipMad: 'MAD (Monthly Active Devices): unique devices that have your app installed and were active in the last 30 days. Shows how many devices really keep the app.',
      tipRevenue: 'Revenue: in-app purchase and paid download revenue in the last 28 days (estimated, before Play fees).',
      tipLifeAll: 'Total installs: sum of all “device acquisitions” in Play Console statistics. Reinstalls on the same device are counted too.',
      tipLifeNew: 'First installs: installs on devices that never had the app before (new device acquisitions). Closest metric to unique installs.',
      tipSince: 'Play Console provides this metric from this month on. Earlier installs are not included in the totals.',
    },
  };
  let LANG = /^tr\b/i.test(navigator.language || '') ? 'tr' : 'en';
  const IS_MAC = /Mac|iPhone|iPad/i.test(navigator.userAgentData?.platform || navigator.platform || navigator.userAgent);
  const KEYS = IS_MAC ? { K: '⌘K', M: '⌘' } : { K: 'Ctrl+K', M: 'Ctrl' };
  const t = (k, ...a) => String((I18N[LANG] || I18N.en)[k] ?? I18N.en[k] ?? k).replace(/\{(\d)\}/g, (_, i) => a[i]).replace(/\{([KM])\}/g, (_, x) => KEYS[x]);
  const locale = () => (LANG === 'tr' ? 'tr-TR' : 'en-US');
  const fmt = (n) => { if (n == null) return '–'; const tr = LANG === 'tr', d = (x) => (tr ? x.replace('.', ',') : x);
    return n >= 1e6 ? d((n / 1e6).toFixed(1)) + (tr ? ' Mn' : 'M') : n >= 1e4 ? d((n / 1e3).toFixed(1)) + (tr ? ' B' : 'K') : n.toLocaleString(locale()); };

  const SECTIONS = [
    { key: 'dash', label: 'Kontrol paneli', path: 'app-dashboard', kw: 'dashboard panel' },
    { key: 'stats', label: 'İstatistikler', path: 'statistics', kw: 'stats istatistik' },
    { key: 'rel', label: 'Sürümler', path: 'releases/overview', kw: 'release surum bundle' },
    { key: 'prod', label: 'Üretim kanalı', path: 'tracks/production', kw: 'production uretim' },
    { key: 'int', label: 'Dahili test', path: 'tracks/internal-testing', kw: 'internal test' },
    { key: 'closed', label: 'Kapalı test', path: 'closed-testing', kw: 'closed test' },
    { key: 'pub', label: 'Yayınlama özeti', path: 'publishing', kw: 'publishing review inceleme gonder' },
    { key: 'store', label: 'Mağaza girişleri', path: 'store-listings', kw: 'store listing magaza aso' },
    { key: 'reviews', label: 'Yorumlar', path: 'user-feedback/reviews', kw: 'reviews yorum' },
    { key: 'ratings', label: 'Puanlar', path: 'user-feedback/ratings', kw: 'rating puan' },
    { key: 'vitals', label: 'Android vitals', path: 'vitals/metrics/overview', kw: 'vitals anr' },
    { key: 'crashes', label: 'Kilitlenmeler ve ANR', path: 'vitals/crashes', kw: 'crash anr kilitlenme' },
    { key: 'policy', label: 'Politika durumu', path: 'policy-center', kw: 'policy politika' },
    { key: 'content', label: 'Uygulama içeriği', path: 'app-content/overview', kw: 'app content icerik data safety' },
    { key: 'acq', label: 'Mağaza analizi', path: 'reporting/acquisition/overview', kw: 'acquisition edinme analiz' },
    { key: 'iap', label: 'Uygulama içi ürünler', path: 'one-time-products', kw: 'iap urun product' },
    { key: 'subs', label: 'Abonelikler', path: 'subscriptions', kw: 'subscription abonelik' },
    { key: 'rev', label: 'Gelir', path: 'reporting/finance/revenue', kw: 'revenue gelir finance' },
  ];
  SECTIONS.forEach((s) => Object.defineProperty(s, 'label', { get: () => t('sec_' + s.key) }));
  const ROW_LINKS = ['stats', 'rel', 'store', 'reviews', 'vitals', 'policy'];
  const appUrl = (id, path) => `${base()}/app/${id}/${path}`;

  // ---------- scraping ----------
  function parseNum(s) {
    if (!s) return null;
    const m = s.match(/(\d[\d.,]*)\s*([kKmMbB])?/);
    if (!m) return null;
    let n = parseFloat(m[1].replace(/,/g, ''));
    const mul = { k: 1e3, m: 1e6, b: 1e9 }[(m[2] || '').toLowerCase()] || 1;
    return Math.round(n * mul);
  }
  function parseScore(el) {
    if (!el) return null;
    const label = txt($('[debug-id=label-tooltip]', el));
    let rest = txt(el).replace(label, '').replace(/arrow_\w+/g, '').trim();
    const dm = rest.match(/([<>]?)([+-]?\d[\d.,]*)%/);
    const delta = dm ? parseFloat(dm[2].replace(/,/g, '')) : null;
    if (dm) rest = rest.replace(dm[0], '').trim();
    const value = rest === '-' || rest === '' ? null : parseNum(rest);
    return { label, raw: rest === '-' ? '' : rest, value, delta };
  }
  function scrapeRows() {
    return $$('tr[debug-id=table-row]').map((r) => {
      const link = $('a[href*="/app/"]', r);
      const id = link ? (link.getAttribute('href').match(/\/app\/(\d+)/) || [])[1] : null;
      const badges = $$('[debug-id$=badge]', r).map((b) => ({
        type: b.getAttribute('debug-id'),
        text: txt(b).replace(/^(info|warning|error)\s+/, ''),
      }));
      const sc = (k) => parseScore($(`[debug-id=${k}-scorecard]`, r));
      const img = $('img', r);
      return {
        id,
        title: txt($('[debug-id=app-title]', r)),
        pkg: txt($('[debug-id=app-package-name]', r)),
        updated: txt($('[debug-id=app-last-updated]', r)).replace(/^Last updated on\s*/i, ''),
        state: txt($('[debug-id=app-state-label]', r)),
        icon: img ? img.src : '',
        badges,
        installs: sc('installs'),
        revenue: sc('revenue'),
        mad: sc('mad'),
        opens: sc('device-first-opens'),
        loading: !!r.querySelector('loading-data'),
      };
    }).filter((a) => a.id);
  }
  function pager() {
    const lbl = $$('div,span').find((e) => e.childElementCount === 0 && /^\s*\d+\s*[-–]\s*\d+\s+\S+\s+\d+\s*$/.test(e.textContent));
    if (!lbl) return null;
    let p = lbl;
    for (let i = 0; i < 5 && p; i++) { if ($$('material-button', p).length >= 4) break; p = p.parentElement; }
    const b = p ? $$('material-button', p) : [];
    if (b.length < 4) return null;
    const total = parseInt((lbl.textContent.match(/(\d+)\s*$/) || [])[1], 10);
    return { first: b[0], next: b[2], total, enabled: (x) => x.getAttribute('aria-disabled') !== 'true' };
  }
  const firstTitle = () => txt($('tr[debug-id=table-row] [debug-id=app-title]'));
  async function waitChange(prev, ms = 10000) {
    const t0 = Date.now();
    while (Date.now() - t0 < ms) { await sleep(150); const t = firstTitle(); if (t && t !== prev) return true; }
    return false;
  }
  // Play Console loads each row's metrics asynchronously (a <loading-data> element is shown,
  // and the scorecards read "-" until it finishes). Wait until no row is loading and the
  // table text is stable before reading.
  const rowsSig = () => $$('tr[debug-id=table-row] [debug-id=app-metrics]').map(txt).join('|');
  async function waitLoaded(ms = 15000) {
    const t0 = Date.now();
    let last = '', stable = 0;
    while (Date.now() - t0 < ms) {
      await sleep(250);
      const loading = !!$('tr[debug-id=table-row] loading-data');
      const sig = rowsSig();
      stable = !loading && sig === last ? stable + 1 : 0;
      last = sig;
      if (stable >= 3) return true;
    }
    return false;
  }
  const METRICS = ['installs', 'revenue', 'mad', 'opens'];
  async function collectAll(onProgress, prevApps = []) {
    const prev = new Map(prevApps.map((a) => [a.id, a]));
    const map = new Map();
    const add = () => scrapeRows().forEach((a) => {
      // A row still loading after the timeout: keep the last known numbers instead of blanks.
      const old = prev.get(a.id);
      if (a.loading && old) for (const k of METRICS) if ((!a[k] || a[k].value == null) && old[k]?.value != null) { a[k] = old[k]; a.stale = true; }
      map.set(a.id, a);
    });
    await waitLoaded();
    add();
    const pg = pager();
    if (pg && pg.enabled(pg.next)) {
      let guard = 0;
      while (guard++ < 50) {
        const p = pager();
        if (!p || !p.enabled(p.next)) break;
        const prevTitle = firstTitle();
        p.next.click();
        if (!(await waitChange(prevTitle))) break;
        await waitLoaded();
        add();
        onProgress && onProgress(map.size, p.total);
      }
      const p = pager();
      if (p && p.enabled(p.first)) { const prevTitle = firstTitle(); p.first.click(); await waitChange(prevTitle); }
    }
    return [...map.values()];
  }

  // ---------- issue classification ----------
  function issues(a) {
    const out = [];
    if (/removed|suspended|rejected|kaldırıl|askıya/i.test(a.state)) out.push({ lvl: 3, text: a.state, link: 'policy' });
    for (const b of a.badges) {
      if (b.type === 'policy-issues-badge') out.push({ lvl: 2, text: b.text, link: 'policy' });
      else if (b.type === 'anr-rate-badge') out.push({ lvl: parseFloat(b.text) >= 0.47 ? 2 : 1, text: b.text, link: 'crashes' });
      else if (/rejected|reddedil/i.test(b.text)) out.push({ lvl: 3, text: b.text, link: 'pub' });
      else if (/not yet sent|gönderilmedi/i.test(b.text)) out.push({ lvl: 1, text: b.text, link: 'pub' });
      else if (/review|inceleme/i.test(b.text)) out.push({ lvl: 0, text: b.text, link: 'pub' });
      else out.push({ lvl: 1, text: b.text, link: 'dash' });
    }
    return out.sort((x, y) => y.lvl - x.lvl);
  }
  const TR_TEXT = [
    [/Changes not yet sent for review/i, 'Gönderilmemiş değişiklikler'],
    [/Changes rejected/i, 'Değişiklikler reddedildi'],
    [/Changes in review/i, 'İncelemede'],
    [/Removed by Google/i, 'Google kaldırdı'],
    [/(\d+) policy tasks?/i, '$1 politika görevi'],
    [/(\d+) policy issues?/i, '$1 politika sorunu'],
    [/([\d.,]+%) ANR rate/i, 'ANR $1'],
    [/([\d.,]+%) crash rate/i, 'Çökme $1'],
  ];
  const tr = (x) => { if (LANG !== 'tr') return x; for (const [re, r] of TR_TEXT) if (re.test(x)) return x.replace(re, r); return x; };
  const stateKind = (s) => (/production|üretim/i.test(s) ? 'live' : /test/i.test(s) ? 'test' : /removed|suspended|rejected|kaldır/i.test(s) ? 'bad' : 'other');
  const TR_STATE = { Production: 'Yayında', 'Internal testing': 'Dahili test', 'Closed testing': 'Kapalı test', 'Open testing': 'Açık test', 'Removed by Google': 'Google kaldırdı', Draft: 'Taslak', Unpublished: 'Yayından kaldırıldı' };

  // ---------- UI host (shadow DOM) ----------
  const host = document.createElement('div');
  host.id = 'pcp-host';
  host.style.cssText = 'all:initial;position:fixed;inset:0;pointer-events:none;z-index:2147483000;';
  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = `<style>${CSS()}</style><div id="fab" title="Play Console Plus"></div><div id="panel" hidden></div><div id="pal" hidden></div><div id="toast" hidden></div>`;
  document.documentElement.appendChild(host);
  const fab = root.getElementById('fab');
  const panel = root.getElementById('panel');
  const pal = root.getElementById('pal');
  const toastEl = root.getElementById('toast');
  // Progress toast (top-left of the Plus view). Updated in place so it doesn't flicker on re-render.
  const TOAST = { home: null };
  function updateToast() {
    const lines = [];
    if (TOAST.home) lines.push({ txt: TOAST.home[1] ? t('loadingN', TOAST.home[0], TOAST.home[1]) : t('loading'), p: TOAST.home[1] ? TOAST.home[0] / TOAST.home[1] : null });
    if (S.lifeLoading) {
      const cur = [...(S.busy || [])].map((id) => (S.apps.find((a) => a.id === id) || {}).title).filter(Boolean).slice(0, 2).join(', ');
      lines.push({ txt: t('lifeLoading', S.lifeLoading[0], S.lifeLoading[1]), sub: cur, p: S.lifeLoading[1] ? S.lifeLoading[0] / S.lifeLoading[1] : null });
    }
    const show = lines.length && !panel.hidden;
    if (!show) { if (!toastEl.hidden) { toastEl.classList.add('out'); clearTimeout(toastEl._t); toastEl._t = setTimeout(() => { toastEl.hidden = true; toastEl.classList.remove('out'); }, 250); } return; }
    clearTimeout(toastEl._t); toastEl.classList.remove('out');
    toastEl.hidden = false;
    const tb = panel.querySelector('.top'); toastEl.style.top = ((tb ? tb.getBoundingClientRect().bottom : 56) + 10) + 'px';
    toastEl.innerHTML = lines.map((l) => `<div class="tl"><span class="spin"></span><div class="tt"><b>${esc(l.txt)}</b>${l.sub ? `<small>${esc(l.sub)}</small>` : ''}${l.p != null ? `<div class="bar"><i style="width:${Math.round(l.p * 100)}%"></i></div>` : ''}</div></div>`).join('');
  }

  const S = { mode: '28', life: {}, lifeLoading: null, bell: false, sel: new Set(), G: { groups: [], map: {}, order: [], noneCollapsed: false }, apps: [], sort: { k: 'issues', dir: -1 }, filter: 'all', q: '', dark: false, autoOpen: true, periodDays: '', loading: false, updatedAt: 0 };

  // ---------- dark theme ----------
  function applyDark() {
    let st = document.getElementById('pcp-dark');
    if (S.dark && !st) {
      st = document.createElement('style');
      st.id = 'pcp-dark';
      st.textContent = `html{background:#111!important}
        body>*:not(#pcp-host){filter:invert(.9) hue-rotate(180deg)}
        body>*:not(#pcp-host) img,body>*:not(#pcp-host) video,body>*:not(#pcp-host) canvas,body>*:not(#pcp-host) svg image{filter:invert(1) hue-rotate(180deg)}`;
      document.head.appendChild(st);
    } else if (!S.dark && st) st.remove();
    host.classList.toggle('dark', S.dark);
    root.host.setAttribute('data-theme', S.dark ? 'dark' : 'light');
  }

  // ---------- groups ----------
  const NONE = '_none';
  const gKey = () => 'pcp:groups:' + devId();
  const saveGroups = () => store.setSync(gKey(), S.G);
  const groupOf = (a) => (S.G.groups.some((g) => g.id === S.G.map[a.id]) ? S.G.map[a.id] : NONE);
  const groupName = (gid) => (S.G.groups.find((g) => g.id === gid) || {}).name || t('ungrouped');
  function newGroup(ask = true) {
    const name = (window.prompt(t('newGroupPrompt'), '') || '').trim();
    if (!name) return null;
    const g = { id: 'g' + Date.now().toString(36), name, collapsed: false };
    S.G.groups.push(g); saveGroups();
    return g.id;
  }
  function assign(ids, gid) {
    for (const id of ids) { if (gid === NONE) delete S.G.map[id]; else S.G.map[id] = gid; }
    saveGroups();
  }
  // Move ids so they sit before/after targetId in the custom order (and switch to custom order).
  function reorder(ids, targetId, after) {
    const cur = filteredAll().map((a) => a.id);
    let order = (S.G.order || []).filter((id) => S.apps.some((a) => a.id === id));
    // seed custom order from what is on screen now, so the first drag keeps the visible order
    if (S.sort.k !== 'manual') order = cur.concat(order.filter((id) => !cur.includes(id)));
    for (const a of S.apps) if (!order.includes(a.id)) order.push(a.id);
    order = order.filter((id) => !ids.includes(id));
    let at = order.indexOf(targetId);
    if (at < 0) at = order.length; else if (after) at++;
    order.splice(at, 0, ...ids);
    S.G.order = order;
    setSort({ k: 'manual', dir: 1 });
    saveGroups();
  }
  function setSort(v) { S.sort = v; store.set('pcp:sort', v); }
  function isCollapsed(gid) { return gid === NONE ? !!S.G.noneCollapsed : !!(S.G.groups.find((g) => g.id === gid) || {}).collapsed; }
  function setCollapsed(gid, v) { if (gid === NONE) S.G.noneCollapsed = v; else { const g = S.G.groups.find((x) => x.id === gid); if (g) g.collapsed = v; } saveGroups(); }

  // ---------- panel ----------
  function filteredAll() { return filtered(); }
  function filtered() {
    const q = norm(S.q);
    let list = S.apps.filter((a) => {
      if (q && !norm(a.title + ' ' + a.pkg).includes(q)) return false;
      if (S.filter === 'live') return stateKind(a.state) === 'live';
      if (S.filter === 'test') return stateKind(a.state) === 'test';
      if (S.filter === 'issues') return issues(a).some((i) => i.lvl >= 1);
      return true;
    });
    const k = S.sort.k, d = S.sort.dir;
    const val = (a) => {
      switch (k) {
        case 'manual': { const i = (S.G.order || []).indexOf(a.id); return i < 0 ? 1e6 + S.apps.indexOf(a) : i; }
        case 'title': return norm(a.title);
        case 'state': return a.state;
        case 'issues': return issues(a).reduce((s, i) => s + Math.pow(10, i.lvl), 0);
        case 'installs': case 'mad': case 'revenue': case 'opens': return a[k]?.value ?? -1;
        case 'installsD': return a.installs?.delta ?? -1e9;
        case 'lifeAll': return S.life[a.id]?.all ?? -1;
        case 'lifeNew': return S.life[a.id]?.new ?? -1;
        case 'since': return S.life[a.id]?.since || '';
        case 'new28': return S.life[a.id]?.d28?.new ?? -1;
        case 'revLife': return S.life[a.id]?.rev?.life ?? (a.revenue ? -0.5 : -1);
        case 'madD': return a.mad?.delta ?? -1e9;
        case 'updated': return Date.parse(a.updated) || 0;
      }
    };
    return list.sort((x, y) => { const a = val(x), b = val(y); return (a > b ? 1 : a < b ? -1 : 0) * d; });
  }
  const delta = (d) => (d == null ? '' : `<span class="d ${d > 0 ? 'up' : d < 0 ? 'down' : ''}">${d > 0 ? '▲' : d < 0 ? '▼' : ''}${Math.abs(d)}%</span>`);
  const metric = (m) => (m && m.value != null ? `<b>${esc(m.raw)}</b>${delta(m.delta)}` : '<span class="mut">–</span>');

  const NC = () => (S.mode === 'life' ? 11 : 12);
  const CURSYM = { TRY: '₺', USD: '$', EUR: '€', GBP: '£' };
  const money = (v, cur) => (v == null ? '–' : (CURSYM[cur] || (cur ? cur + ' ' : '')) + fmt(Math.round(v)));
  const SPIN = '<span class="spin"></span>';
  const failMark = () => `<span class="fail" title="${esc(t('failTip'))}">${t('lifeErr')}</span>`;
  // value present -> show; currently loading -> spinner; failed -> mark; else dash
  const cell = (a, has, show, failed) => (has ? show() : S.busy.has(a.id) ? SPIN : failed ? failMark() : '<span class="mut">–</span>');
  function lifeCells(a) {
    const L = S.life[a.id] || {};
    if (L.all == null) return `<td class="n" colspan="2">${cell(a, false, null, L.lifeFail || L.err)}</td>`;
    const since = L.since ? `<small class="mut" title="${esc(t('tipSince'))}">${esc(L.since)}</small>` : '';
    return `<td class="n"><b>${fmt(L.all)}</b>${since ? '<br>' + since : ''}</td><td class="n">${fmt(L.new)}</td>`;
  }
  function rowHtml(a) {
          const iss = issues(a);
          const man = S.life[a.id]?.manualAt;
          const manTime = man ? new Date(man).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' }) : '';
          return `<tr class="ar${man ? ' fetched' : ''}${S.flash.has(a.id) ? ' flash' : ''}${S.busy.has(a.id) ? ' busy' : ''}" draggable="true" data-id="${a.id}">
            <td class="cb"><input type="checkbox" data-sel="${a.id}" ${S.sel.has(a.id) ? 'checked' : ''}></td>
            <td class="app"><a href="${appUrl(a.id, 'app-dashboard')}">${a.icon ? `<img src="${esc(a.icon)}">` : '<i></i>'}<span><b>${esc(a.title)}</b><small>${esc(a.pkg)}${a.stale ? ` · <span title="${esc(t('staleTitle'))}">${t('stale')}</span>` : ''}${man ? ` <span class="fbadge" title="${esc(t('fetchedTip', manTime))}">↻ ${manTime}</span>` : ''}</small></span></a></td>
            <td><span class="st ${stateKind(a.state)}">${esc((LANG === 'tr' && TR_STATE[a.state]) || a.state)}</span></td>
            <td class="iss">${iss.map((i) => `<a class="tag l${i.lvl}" href="${appUrl(a.id, SECTIONS.find((s) => s.key === i.link).path)}">${esc(tr(i.text))}</a>`).join('') || '<span class="mut">—</span>'}</td>
            ${S.mode === 'life' ? lifeCells(a) : `<td class="n">${a.installs?.value != null ? `<b>${esc(a.installs.raw)}</b>` : cell(a, S.life[a.id]?.d28, () => `<b title="${esc(t('fromStats'))}">${fmt(S.life[a.id].d28.all)}</b>`, S.life[a.id]?.d28Fail)}</td>
            <td class="n">${delta(a.installs?.delta)}</td>
            <td class="n">${cell(a, S.life[a.id]?.d28, () => fmt(S.life[a.id].d28.new), S.life[a.id]?.d28Fail)}</td>`}
            <td class="n">${a.mad?.value != null ? `<b>${esc(a.mad.raw)}</b>` : '<span class="mut">–</span>'}</td>
            <td class="n">${delta(a.mad?.delta)}</td>
            <td class="n">${!a.revenue ? `<span class="mut" title="${t('freeTitle')}">${t('free')}</span>`
              : S.mode === 'life' ? cell(a, S.life[a.id]?.rev, () => `<b>${money(S.life[a.id].rev.life, S.life[a.id].rev.cur)}</b>`, S.life[a.id]?.revFail)
              : metric(a.revenue)}</td>
            <td class="mut small nw">${esc(a.updated)}</td>
            <td class="lnk">${ROW_LINKS.map((k) => `<a href="${appUrl(a.id, SECTIONS.find((x) => x.key === k).path)}">${t('short_' + k)}</a>`).join('')}</td>
          </tr>`;
  }
  function groupHeader(gid, items, total) {
    const col = isCollapsed(gid) && !S.q;
    const sumk = (k) => items.reduce((t, a) => t + (a[k]?.value || 0), 0);
    const warn = items.filter((a) => issues(a).some((i) => i.lvl >= 1)).length;
    const real = gid !== NONE;
    return `<tr class="gh ${col ? 'col' : ''}" data-g="${gid}"><td colspan="${NC()}"><div class="ghi">
      <button class="tg" data-tg="${gid}">${col ? '▸' : '▾'}</button>
      <b class="gn" data-tg="${gid}">${esc(groupName(gid))}</b>
      <span class="mut small">${t(S.mode === 'life' ? 'groupStatsLife' : 'groupStats', items.length + (items.length !== total ? ' / ' + total : ''), fmt(S.mode === 'life' ? items.reduce((x, a) => x + (S.life[a.id]?.all || 0), 0) : sumk('installs')), fmt(sumk('mad')))}${(() => { const r = S.mode === 'life' ? Math.round(items.reduce((x, a) => x + (S.life[a.id]?.rev?.life || 0), 0)) : sumk('revenue'); return r ? t('groupRevenue', fmt(r)) : ''; })()}</span>
      ${warn ? `<span class="tag l2">${t('nActions', warn)}</span>` : ''}
      <span class="sp"></span>
      ${real ? `<span class="gact"><button data-gu="${gid}" title="${t('moveUp')}">↑</button><button data-gd="${gid}" title="${t('moveDown')}">↓</button><button data-gr="${gid}" title="${t('rename')}">✎</button><button data-gx="${gid}" title="${t('deleteGroup')}">🗑</button></span>` : ''}
    </div></td></tr>`;
  }
  function buildBody(list) {
    if (!S.G.groups.length) return list.map(rowHtml).join('');
    const order = [...S.G.groups.map((g) => g.id), NONE];
    return order.map((gid) => {
      const items = list.filter((a) => groupOf(a) === gid);
      const total = S.apps.filter((a) => groupOf(a) === gid).length;
      if (gid === NONE && !total) return '';
      if (S.q && !items.length) return '';
      const col = isCollapsed(gid) && !S.q;
      return `<tbody class="grp" data-g="${gid}">${groupHeader(gid, items, total)}${col ? '' : items.map(rowHtml).join('') || `<tr class="empty-g"><td colspan="${NC()}" class="mut small">${t('groupEmpty')}</td></tr>`}</tbody>`;
    }).join('');
  }

  function renderPanel() {
    const apps = S.apps;
    const live = apps.filter((a) => stateKind(a.state) === 'live').length;
    const act = apps.filter((a) => issues(a).some((i) => i.lvl >= 1));
    const sum = (k) => apps.reduce((s, a) => s + (a[k]?.value || 0), 0);
    const cur = (apps.find((a) => a.revenue?.label) || {}).revenue?.label.match(/\(([^)]+)\)/)?.[1] || '';
    const list = filtered();
    const bodyHtml = buildBody(list);
    const allSel = list.length && list.every((a) => S.sel.has(a.id));
    const th = (k, l, cls = '', tip = '') => `<th data-k="${k}" class="${cls} ${S.sort.k === k ? 'on' : ''}">${tip ? `<span class="tip" data-tip="${esc(tip)}">${l}<i>?</i></span>` : l}${S.sort.k === k ? (S.sort.dir > 0 ? ' ↑' : ' ↓') : ''}</th>`;
    const ago = S.updatedAt ? new Date(S.updatedAt).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' }) : '';

    const tw0 = panel.querySelector('.tw');
    const scrollY = tw0 ? tw0.scrollTop : 0;
    panel.innerHTML = `
      <div class="top">
        <div class="ttl">Play Console <span>Plus</span></div>
        <input id="q" placeholder="${t('search')}" value="${esc(S.q)}">
        <div class="chips">
          ${[['all', `${t('all')} ${apps.length}`], ['live', `${t('live')} ${live}`], ['test', t('test')], ['issues', `${t('action')} ${act.length}`]]
            .map(([k, l]) => `<button class="chip ${S.filter === k ? 'on' : ''}" data-f="${k}">${l}</button>`).join('')}
        </div>
        <div class="seg"><button data-mode="28" class="${S.mode === '28' ? 'on' : ''}">${t('p28')}</button><button data-mode="life" class="${S.mode === 'life' ? 'on' : ''}">${t('pLife')}</button>${S.mode === 'life' ? `<button id="liferef" title="${t('lifeRefresh')}">↻</button>` : ''}</div>
        <div class="sp"></div>
        <span class="mut small" id="status">${ago ? t('updated', ago) : ''}</span>
        <button class="btn ${S.sort.k === 'manual' ? 'on' : ''}" id="manual" title="${t('customOrderTitle')}">${t('customOrder')}</button>
        <button class="btn" id="addg">${t('addGroup')}</button>
        ${S.G.groups.length ? `<button class="ib" id="colall" title="${t('collapseAll')}">${S.G.groups.every((g) => g.collapsed) ? '⊞' : '⊟'}</button>` : ''}
        <button class="ib" id="refresh" title="${t('refresh')}">↻</button>
        <button class="ib lang" id="lang" title="${t('language')}">${LANG === 'tr' ? 'EN' : 'TR'}</button>
        <button class="ib" id="dark" title="${t('darkTheme')}">${S.dark ? '☀' : '☾'}</button>
        <div class="bellw">
          <button class="ib bell ${S.bell ? 'act' : ''}" id="bell" title="${t('notifications')}"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22Zm7-6V11a7 7 0 0 0-5.5-6.84V3.5a1.5 1.5 0 0 0-3 0v.66A7 7 0 0 0 5 11v5l-2 2v1h18v-1l-2-2Z"/></svg>${act.length ? `<span class="cnt ${act.some((a) => issues(a).some((i) => i.lvl >= 3)) ? 'red' : ''}">${act.length}</span>` : ''}</button>
          ${S.bell ? `<div class="ndrop"><div class="nh"><b>${t('notifications')}</b><span class="mut small">${t('nWaiting', act.length)}</span></div>
            ${act.length ? act.map((a) => ({ a, is: issues(a).filter((i) => i.lvl >= 1) })).sort((x, y) => y.is[0].lvl - x.is[0].lvl).map(({ a, is }) =>
              `<a class="ni l${is[0].lvl}" href="${appUrl(a.id, SECTIONS.find((s) => s.key === is[0].link).path)}">${a.icon ? `<img src="${esc(a.icon)}">` : '<i></i>'}<span><b>${esc(a.title)}</b><small>${is.map((i) => esc(tr(i.text))).join(' · ')}</small></span><em></em></a>`).join('')
              : `<div class="empty">${t('allGood')}</div>`}</div>` : ''}
        </div>
        <button class="btn" id="orig" title="${t('origTitle')}">${t('orig')}</button>
      </div>
      <div class="cards">
        <div class="card"><div class="k">${t('cApps')}</div><div class="v">${apps.length}</div><div class="s">${t('cLive', live)}</div></div>
        <div class="card click ${act.length ? 'warn' : ''}" id="actcard" title="${t('showNotifs')}"><div class="k">${t('cAction')}</div><div class="v">${act.length}</div><div class="s">${t('cActionSub')}</div></div>
        ${S.mode === 'life'
          ? `<div class="card"><div class="k tip" data-tip="${esc(t('tipLifeAll'))}">${t('cLifeAll')}<i>?</i></div><div class="v">${fmt(apps.reduce((x, a) => x + (S.life[a.id]?.all || 0), 0))}</div><div class="s">${t('cLifeSub', apps.filter((a) => S.life[a.id] && !S.life[a.id].err).length)}</div></div>`
          : `<div class="card"><div class="k tip" data-tip="${esc(t('tipInstalls'))}">${t('cInstalls')}<i>?</i></div><div class="v">${fmt(sum('installs'))}</div><div class="s">${S.periodDays ? t('period', S.periodDays) : ''}</div></div>`}
        <div class="card"><div class="k tip" data-tip="${esc(t('tipMad'))}">${t('cMad')}<i>?</i></div><div class="v">${fmt(sum('mad'))}</div><div class="s">${t('total')}</div></div>
        ${S.mode === 'life'
          ? `<div class="card"><div class="k tip" data-tip="${esc(t('tipRevLife'))}">${t('cRevenue')}<i>?</i></div><div class="v">${fmt(Math.round(apps.reduce((x, a) => x + (S.life[a.id]?.rev?.life || 0), 0)))} <small>${esc(cur)}</small></div><div class="s">${t('revLifeSub')}</div></div>`
          : `<div class="card"><div class="k tip" data-tip="${esc(t('tipRevenue'))}">${t('cRevenue')}<i>?</i></div><div class="v">${fmt(sum('revenue'))} <small>${esc(cur)}</small></div><div class="s">${S.periodDays ? t('period', S.periodDays) : ''}</div></div>`}
      </div>
      ${S.sel.size ? `<div class="bulk"><b>${t('nSelected', S.sel.size)}</b>
        <span>${t('moveTo')}</span>
        <select id="bsel"><option value="">${t('choose')}</option>${S.G.groups.map((g) => `<option value="${g.id}">${esc(g.name)}</option>`).join('')}<option value="__new">${t('newGroupOpt')}</option></select>
        <button class="btn" id="bmove">${t('move')}</button>
        <button class="btn ghost" id="bnone">${t('ungroup')}</button>
        <span class="vsep"></span>
        <button class="btn prim" id="bfetch" title="${esc(t('fetchSelTip'))}">↻ ${t('fetchSel', S.mode === 'life' ? t('pLife') : t('p28'))}</button>
        <button class="btn ghost" id="bclr">${t('clearSel')}</button></div>` : ''}
      <div class="tw"><table>
        <thead><tr>
          <th class="cb"></th>${th('title', t('hApp'))}${th('state', t('hState'))}${th('issues', t('hIssues'))}
          ${S.mode === 'life' ? th('lifeAll', t('hLifeAll'), 'n', t('tipLifeAll')) + th('lifeNew', t('hLifeNew'), 'n', t('tipLifeNew'))
            : th('installs', t('hInstalls'), 'n', t('tipInstalls')) + th('installsD', 'Δ', 'n', t('tipDelta')) + th('new28', t('hNew28'), 'n', t('tipNew28'))}${th('mad', 'MAD', 'n', t('tipMad'))}${th('madD', 'Δ', 'n', t('tipDelta'))}
          ${S.mode === 'life' ? th('revLife', t('hRevenue'), 'n', t('tipRevLife')) : th('revenue', t('hRevenue'), 'n', t('tipRevenue'))}${th('updated', t('hUpdated'))}<th>${t('hLinks')}</th>
        </tr></thead>
        ${S.G.groups.length ? bodyHtml : `<tbody>${bodyHtml}</tbody>`}
      </table>${list.length ? '' : `<div class="empty">${t('noMatch')}</div>`}</div>
      <div class="foot mut small">${t('foot')}</div>`;

    const q = root.getElementById('q');
    q.oninput = () => { S.q = q.value; const pos = q.selectionStart; renderPanel(); const n = root.getElementById('q'); n.focus(); n.setSelectionRange(pos, pos); };
    $$('[data-f]', panel).forEach((b) => (b.onclick = () => { S.filter = b.dataset.f; renderPanel(); }));
    $$('th[data-k]', panel).forEach((h) => (h.onclick = () => {
      const k = h.dataset.k;
      setSort(S.sort.k === k ? { k, dir: -S.sort.dir } : { k, dir: k === 'title' || k === 'state' ? 1 : -1 });
      renderPanel();
    }));
    const tw = panel.querySelector('.tw'); if (tw) tw.scrollTop = scrollY;
    root.getElementById('orig').onclick = () => setView(false);
    root.getElementById('lang').onclick = () => setLang(LANG === 'tr' ? 'en' : 'tr');
    root.getElementById('bell').onclick = (e) => { e.stopPropagation(); S.bell = !S.bell; renderPanel(); };
    root.getElementById('actcard').onclick = (e) => { e.stopPropagation(); S.bell = true; renderPanel(); };
    const nd = panel.querySelector('.ndrop'); if (nd) nd.onclick = (e) => e.stopPropagation();
    panel.onclick = () => { if (S.bell) { S.bell = false; renderPanel(); } };
    root.getElementById('manual').onclick = () => { setSort({ k: 'manual', dir: 1 }); renderPanel(); };
    root.getElementById('refresh').onclick = () => refresh();
    root.getElementById('dark').onclick = () => { S.dark = !S.dark; store.set('pcp:dark', S.dark); applyDark(); renderPanel(); };
    $$('[data-mode]', panel).forEach((b) => (b.onclick = () => setMode(b.dataset.mode)));
    const lr = root.getElementById('liferef'); if (lr) lr.onclick = () => loadLifetime(true);
    wireGroups(list);
    updateToast();
  }

  function wireGroups(list) {
    const on = (id, fn) => { const e = root.getElementById(id); if (e) e.onclick = fn; };
    on('addg', () => { const gid = newGroup(); if (gid && S.sel.size) { assign(S.sel, gid); S.sel.clear(); } renderPanel(); });
    on('colall', () => { const all = S.G.groups.every((g) => g.collapsed); S.G.groups.forEach((g) => (g.collapsed = !all)); S.G.noneCollapsed = !all; saveGroups(); renderPanel(); });
    $$('[data-sel]', panel).forEach((c) => (c.onchange = () => { c.checked ? S.sel.add(c.dataset.sel) : S.sel.delete(c.dataset.sel); renderPanel(); }));
    on('bmove', () => {
      let gid = root.getElementById('bsel').value;
      if (gid === '__new') gid = newGroup();
      if (!gid) return;
      assign(S.sel, gid); S.sel.clear(); renderPanel();
    });
    const bs = root.getElementById('bsel');
    if (bs) bs.onchange = () => { if (bs.value === '__new') root.getElementById('bmove').click(); };
    on('bnone', () => { assign(S.sel, NONE); S.sel.clear(); renderPanel(); });
    on('bclr', () => { S.sel.clear(); renderPanel(); });
    on('bfetch', () => fetchSelected());
    $$('[data-tg]', panel).forEach((b) => (b.onclick = () => { const g = b.dataset.tg; setCollapsed(g, !isCollapsed(g)); renderPanel(); }));
    const idx = (gid) => S.G.groups.findIndex((g) => g.id === gid);
    const move = (gid, d) => { const i = idx(gid), j = i + d; if (j < 0 || j >= S.G.groups.length) return; const a = S.G.groups; [a[i], a[j]] = [a[j], a[i]]; saveGroups(); renderPanel(); };
    $$('[data-gu]', panel).forEach((b) => (b.onclick = () => move(b.dataset.gu, -1)));
    $$('[data-gd]', panel).forEach((b) => (b.onclick = () => move(b.dataset.gd, 1)));
    $$('[data-gr]', panel).forEach((b) => (b.onclick = () => {
      const g = S.G.groups[idx(b.dataset.gr)]; const n = (window.prompt(t('groupNamePrompt'), g.name) || '').trim();
      if (n) { g.name = n; saveGroups(); renderPanel(); }
    }));
    $$('[data-gx]', panel).forEach((b) => (b.onclick = () => {
      const g = S.G.groups[idx(b.dataset.gx)];
      if (!window.confirm(t('deleteGroupConfirm', g.name))) return;
      S.G.groups.splice(idx(g.id), 1);
      for (const k of Object.keys(S.G.map)) if (S.G.map[k] === g.id) delete S.G.map[k];
      saveGroups(); renderPanel();
    }));
    // drag & drop
    let dragIds = null;
    $$('tr.ar', panel).forEach((r) => (r.ondragstart = (e) => {
      const id = r.dataset.id;
      dragIds = S.sel.has(id) ? [...S.sel] : [id];
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', dragIds.join(','));
      panel.classList.add('dragging');
    }));
    panel.ondragend = () => { panel.classList.remove('dragging'); $$('.grp.over', panel).forEach((x) => x.classList.remove('over')); };
    $$('tbody.grp', panel).forEach((tb) => {
      tb.ondragover = (e) => { if (!dragIds) return; e.preventDefault(); $$('.grp.over', panel).forEach((x) => x !== tb && x.classList.remove('over')); tb.classList.add('over'); };
      tb.ondragleave = (e) => { if (!tb.contains(e.relatedTarget)) tb.classList.remove('over'); };
      tb.ondrop = (e) => { e.preventDefault(); if (!dragIds) return; assign(dragIds, tb.dataset.g); S.sel.clear(); dragIds = null; renderPanel(); };
    });
    const clearMarks = () => $$('tr.ar.ins-b,tr.ar.ins-a', panel).forEach((x) => x.classList.remove('ins-b', 'ins-a'));
    $$('tr.ar', panel).forEach((r) => {
      r.ondragover = (e) => {
        if (!dragIds) return;
        e.preventDefault(); e.stopPropagation();
        const b = r.getBoundingClientRect(), after = e.clientY > b.top + b.height / 2;
        clearMarks(); r.classList.add(after ? 'ins-a' : 'ins-b');
        $$('.grp.over', panel).forEach((x) => x.classList.remove('over'));
      };
      r.ondrop = (e) => {
        if (!dragIds) return;
        e.preventDefault(); e.stopPropagation();
        const after = r.classList.contains('ins-a'), tid = r.dataset.id;
        clearMarks();
        if (dragIds.includes(tid)) { dragIds = null; return; }
        if (S.G.groups.length) { const tg = groupOf(S.apps.find((a) => a.id === tid)); assign(dragIds, tg); }
        reorder(dragIds, tid, after);
        S.sel.clear(); dragIds = null; renderPanel();
      };
    });
    panel.addEventListener('dragend', clearMarks);
  }

  // ---------- extra stats: installs (all time + last 28 days) and lifetime revenue ----------
  // The home page only has 28-day "device acquisitions". For the rest we open each app's own
  // Console pages in a hidden same-origin iframe and read their tables:
  //  1. Statistics, monthly, since 2017  -> total installs + first installs (all time)
  //  2. Statistics, daily, last 28 days  -> first installs (28 days)
  //  3. Financial reports > Revenue      -> lifetime revenue (only for apps that earn money)
  const LIFE_TTL = 12 * 3600e3;
  const lifeKey = () => 'pcp:life:' + devId();
  const ymd = (d) => `${d.getFullYear()}_${String(d.getMonth() + 1).padStart(2, '0')}_${String(d.getDate()).padStart(2, '0')}`;
  const PERIOD_RE = /^(\d{1,2}\s)?[A-Za-zÇĞİÖŞÜçğıöşü.]{3,9}\.?\s\d{4}$/;
  function parseCount(x) {
    const m = String(x).replace(/[,\s]/g, '').match(/^(\d+(?:\.\d+)?)([kKMB])?$/);
    return m ? Math.round(parseFloat(m[1]) * ({ k: 1e3, K: 1e3, M: 1e6, B: 1e9 }[m[2]] || 1)) : null;
  }
  function parseMoney(x) {
    const m = String(x).match(/([A-Z]{3}|[₺$€£])?\s?(-?[\d.,]+)\s?([A-Z]{3})?/);
    if (!m || !/\d/.test(m[2])) return null;
    let n = m[2];
    const lc = n.lastIndexOf(','), ld = n.lastIndexOf('.');
    n = lc > ld ? n.replace(/\./g, '').replace(',', '.') : n.replace(/,/g, '');
    return { value: parseFloat(n), cur: m[1] || m[3] || '' };
  }
  function makeFrame() {
    const f = document.createElement('iframe');
    f.style.cssText = 'position:fixed;left:-4000px;top:0;width:1400px;height:900px;visibility:hidden;pointer-events:none';
    document.body.appendChild(f);
    return f;
  }
  async function openIn(f, url, ready, ms = 30000) {
    f.src = 'about:blank'; await sleep(50);
    f.src = url;
    const t0 = Date.now();
    while (Date.now() - t0 < ms) {
      await sleep(300);
      try { if (f.contentDocument && f.contentDocument.location.href !== 'about:blank' && ready(f.contentDocument)) return true; } catch (e) {}
      if (Date.now() - t0 > 9000 && f.contentDocument && /No data|Veri yok|No results|Sonuç yok/i.test(f.contentDocument.body?.innerText || '') && !ready(f.contentDocument)) return false;
    }
    return false;
  }
  const statRows = (doc) => $$('[role=row]', doc).map((r) => r.innerText.split(/[\n\t]/).map((x) => x.trim()).filter(Boolean)).filter((a) => PERIOD_RE.test(a[0]));
  async function readStats(f, url) {
    if (!(await openIn(f, url, (d) => statRows(d).length))) return null;
    const doc = f.contentDocument, rows = new Map();
    for (let page = 0; page < 60; page++) {
      let sig = '', st = 0;
      for (let i = 0; i < 40 && st < 2; i++) { await sleep(200); const x = JSON.stringify(statRows(doc)); st = x === sig ? st + 1 : 0; sig = x; }
      for (const r of statRows(doc)) rows.set(r[0], r.slice(1).filter((x) => !/%$/.test(x)).map(parseCount).filter((v) => v != null));
      const nb = $$('material-button', doc).find((b) => /next page|sonraki sayfa/i.test(b.getAttribute('aria-label') || ''));
      if (!nb || nb.getAttribute('aria-disabled') === 'true') break;
      const first = statRows(doc)[0]?.[0];
      nb.click();
      for (let i = 0; i < 60; i++) { await sleep(150); if (statRows(doc)[0]?.[0] !== first) break; }
    }
    let all = 0, nw = 0;
    for (const v of rows.values()) { all += v[0] || 0; nw += v[1] || 0; }
    const keys = [...rows.keys()];
    return { all, new: nw, since: keys[keys.length - 1] || '', n: rows.size };
  }
  async function readLifetimeRevenue(f, appId) {
    const ok = await openIn(f, `${base()}/app/${appId}/reporting/finance/revenue`,
      (d) => $$('[role=row],tr', d).some((r) => /lifetime|tüm zaman/i.test(r.innerText)) && $$('[role=row],tr', d).some((r) => /^\s*(Total|Toplam)\b[\s\S]*\d/.test(r.innerText)), 15000);
    if (!ok) return null;
    await sleep(500);
    const rows = $$('[role=row],tr', f.contentDocument).map((r) => r.innerText.split(/[\n\t]/).map((x) => x.trim()).filter(Boolean));
    const head = rows.find((r) => r.some((c) => /^(Lifetime|Tüm zamanlar)$/i.test(c)));
    const total = rows.find((r) => /^(Total|Toplam)$/i.test(r[0]) && r.some((c) => /vs\.|önceki/i.test(c)));
    if (!head || !total) return null;
    const vals = total.filter((c) => /[A-Z]{3}|[₺$€£]/.test(c) && /\d/.test(c)).map(parseMoney).filter(Boolean);
    const life = vals[vals.length - 1];
    return life ? { life: life.value, cur: life.cur } : null;
  }
  // parts: { life: monthly since 2017, d28: daily last 28 days, rev: lifetime revenue }
  async function fetchExtra(app, parts) {
    const end = new Date(Date.now() - 864e5), start28 = new Date(end.getTime() - 27 * 864e5);
    const M = 'DEVICE_ACQUISITION-ALL-EVENTS-PER_INTERVAL-{P}%2CDEVICE_ACQUISITION-NEW-EVENTS-PER_INTERVAL-{P}';
    const statUrl = (p, from) => `${base()}/app/${app.id}/statistics?metrics=${M.replace(/\{P\}/g, p)}&dimension=COUNTRY&dimensionValues=OVERALL&dateRange=${from}-${ymd(end)}&tab=APP_STATISTICS`;
    const out = {};
    const f = makeFrame();
    try {
      if (parts.life) {
        const life = await readStats(f, statUrl('MONTH', '2017_01_01'));
        Object.assign(out, life ? { all: life.all, new: life.new, since: life.since, lifeFail: false } : { lifeFail: true });
      }
      if (parts.d28) {
        const d = await readStats(f, statUrl('DAY', ymd(start28)));
        Object.assign(out, d ? { d28: { all: d.all, new: d.new }, d28Fail: false } : { d28Fail: true });
      }
      if (parts.rev && app.revenue) {
        const r = await readLifetimeRevenue(f, app.id);
        Object.assign(out, r ? { rev: r, revFail: false } : { revFail: true });
      }
    } finally { f.remove(); }
    return out;
  }
  const ALL_PARTS = { life: true, d28: true, rev: true };
  const JOB = { queue: [], running: 0, done: 0, total: 0 };
  S.busy = new Set();
  S.flash = new Set();
  function enqueue(apps, parts, front = false, manual = false) {
    const jobs = apps.filter((a) => !S.busy.has(a.id) && !JOB.queue.some((j) => j.app.id === a.id && JSON.stringify(j.parts) === JSON.stringify(parts)))
      .map((a) => ({ app: a, parts, manual }));
    if (!jobs.length) return;
    JOB.queue = front ? jobs.concat(JOB.queue) : JOB.queue.concat(jobs);
    JOB.total += jobs.length;
    jobs.forEach((j) => S.busy.add(j.app.id));
    S.lifeLoading = [JOB.done, JOB.total];
    if (!panel.hidden) renderPanel();
    const n = Math.min(2 - JOB.running, JOB.queue.length); // two at a time, to stay gentle on Play Console
    for (let i = 0; i < n; i++) runWorker();
  }
  async function runWorker() {
    JOB.running++;
    while (JOB.queue.length) {
      const { app, parts, manual } = JOB.queue.shift();
      try {
        S.life[app.id] = { ...(S.life[app.id] || {}), ...(await fetchExtra(app, parts)), at: Date.now(), manualAt: manual ? Date.now() : null };
        if (manual) { S.flash.add(app.id); setTimeout(() => { S.flash.delete(app.id); const r = panel.querySelector(`tr.ar[data-id="${app.id}"]`); if (r) r.classList.remove('flash'); }, 2200); }
      }
      catch (e) { S.life[app.id] = { ...(S.life[app.id] || {}), lifeFail: !!parts.life, d28Fail: !!parts.d28, at: Date.now() }; }
      if (!JOB.queue.some((j) => j.app.id === app.id)) S.busy.delete(app.id);
      JOB.done++;
      S.lifeLoading = [JOB.done, JOB.total];
      store.set(lifeKey(), S.life);
      if (!panel.hidden) renderPanel();
    }
    JOB.running--;
    if (!JOB.running) { JOB.done = JOB.total = 0; S.lifeLoading = null; S.busy.clear(); if (!panel.hidden) renderPanel(); }
  }
  // automatic: everything missing or older than the TTL
  function loadLifetime(force = false) {
    if (!S.apps.length) return;
    const todo = S.apps.filter((a) => force || !S.life[a.id] || Date.now() - (S.life[a.id].at || 0) > LIFE_TTL);
    if (force) for (const a of todo) delete S.life[a.id];
    enqueue(todo, ALL_PARTS);
  }
  // manual: only the selected apps, only the data the current view needs
  function fetchSelected() {
    const apps = S.apps.filter((a) => S.sel.has(a.id));
    enqueue(apps, S.mode === 'life' ? { life: true, rev: true } : { d28: true }, true, true);
  }
  function setMode(m) {
    S.mode = m; store.set('pcp:mode', m);
    if (m === 'life') { if (/^installs|^new28/.test(S.sort.k)) S.sort = { k: 'lifeAll', dir: -1 }; else if (S.sort.k === 'revenue') S.sort = { k: 'revLife', dir: -1 }; }
    else { if (/^life|since/.test(S.sort.k)) S.sort = { k: 'installs', dir: -1 }; else if (S.sort.k === 'revLife') S.sort = { k: 'revenue', dir: -1 }; }
    loadLifetime();
    renderPanel();
  }

  async function refresh() {
    if (!isHome() || S.loading) return;
    S.loading = true; TOAST.home = [0, 0]; renderPanel();
    const t0 = Date.now();
    while (!$('tr[debug-id=table-row]') && Date.now() - t0 < 15000) await sleep(200);
    const per = $$('*').find((e) => e.childElementCount === 0 && /^(Last \d+ days|Son \d+ gün)$/i.test(e.textContent.trim()));
    S.periodDays = per ? (per.textContent.match(/\d+/) || [])[0] : '';
    try {
      TOAST.home = [0, 0]; updateToast();
      const apps = await collectAll((n, tot) => { TOAST.home = [n, tot]; updateToast(); }, S.apps);
      if (apps.length) { S.apps = apps; S.updatedAt = Date.now(); await store.set('pcp:apps:' + devId(), { apps, at: S.updatedAt, periodDays: S.periodDays }); }
    } finally { S.loading = false; TOAST.home = null; renderPanel(); }
    loadLifetime();
  }

  function setView(plus) {
    S.autoOpen = plus; store.set('pcp:autoOpen', plus);
    togglePanel(plus);
    if (plus && !S.apps.length) refresh();
  }
  function togglePanel(show) {
    const open = show ?? panel.hidden;
    panel.hidden = !open;
    updateToast();
    host.style.pointerEvents = 'none';
    if (open) renderPanel();
  }

  // ---------- command palette ----------
  let palItems = [], palSel = 0;
  const IC = {
    home: '<path d="M12 3 3 10.5V21h6v-6h6v6h6V10.5L12 3Z"/>',
    grid: '<path d="M3 3h8v8H3V3Zm10 0h8v8h-8V3ZM3 13h8v8H3v-8Zm10 0h8v8h-8v-8Z"/>',
    globe: '<path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm6.9 6h-3a15.7 15.7 0 0 0-1.4-3.6A8 8 0 0 1 18.9 8ZM12 4c.8 1.2 1.5 2.5 1.9 4h-3.8c.4-1.5 1.1-2.8 1.9-4ZM4.3 14a8.2 8.2 0 0 1 0-4h3.4a16.5 16.5 0 0 0 0 4H4.3Zm.8 2h3c.3 1.3.8 2.5 1.4 3.6A8 8 0 0 1 5.1 16Zm3-8h-3a8 8 0 0 1 4.4-3.6C8.9 5.5 8.4 6.7 8.1 8ZM12 20c-.8-1.2-1.5-2.5-1.9-4h3.8c-.4 1.5-1.1 2.8-1.9 4Zm2.3-6H9.7a14.7 14.7 0 0 1 0-4h4.6a14.7 14.7 0 0 1 0 4Zm.2 5.6c.6-1.1 1.1-2.3 1.4-3.6h3a8 8 0 0 1-4.4 3.6Zm1.8-5.6a16.5 16.5 0 0 0 0-4h3.4a8.2 8.2 0 0 1 0 4h-3.4Z"/>',
    moon: '<path d="M12.3 2a8 8 0 1 0 9.7 9.7A7 7 0 0 1 12.3 2Z"/>',
  };
  const icon = (k) => `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">${IC[k]}</svg>`;
  function buildItems() {
    const items = [{ label: t('palHome'), url: base() + '/home', kw: 'home ana', icon: 'home' }];
    items.push({ label: t('palPanel'), action: () => { if (!isHome()) { store.set('pcp:autoOpen', true); location.href = base() + '/home'; } else setView(true); }, kw: 'panel plus tablo', icon: 'grid' });
    items.push({ label: t('palLang'), action: () => setLang(LANG === 'tr' ? 'en' : 'tr'), kw: 'language dil english turkce', icon: 'globe' });
    items.push({ label: t('palDark'), action: () => { S.dark = !S.dark; store.set('pcp:dark', S.dark); applyDark(); if (!panel.hidden) renderPanel(); }, kw: 'dark karanlik tema', icon: 'moon' });
    for (const a of S.apps) for (const s of SECTIONS)
      items.push({ label: `${a.title} › ${s.label}`, app: a, url: appUrl(a.id, s.path), kw: `${a.pkg} ${s.kw} ${groupOf(a) !== NONE ? groupName(groupOf(a)) : ''}`, main: s.key === 'dash' });
    return items;
  }
  function palMatches(q) {
    const toks = norm(q).split(/\s+/).filter(Boolean);
    const items = buildItems();
    if (!toks.length) return items.filter((i) => !i.app || i.main);
    return items
      .map((i) => { const h = norm(i.label + ' ' + i.kw); if (!toks.every((t) => h.includes(t))) return null; const l = norm(i.label); return { i, s: (l.startsWith(toks[0]) ? 10 : 0) + (i.main ? 2 : 0) - l.length / 100 }; })
      .filter(Boolean).sort((a, b) => b.s - a.s).map((x) => x.i).slice(0, 60);
  }
  function renderPal(q = '') {
    palItems = palMatches(q);
    palSel = Math.min(palSel, Math.max(0, palItems.length - 1));
    const ul = root.getElementById('pl');
    ul.innerHTML = palItems.map((it, i) => `<li class="${i === palSel ? 'sel' : ''}" data-i="${i}">${it.app && it.app.icon ? `<img src="${esc(it.app.icon)}">` : it.icon ? `<em class="pic">${icon(it.icon)}</em>` : '<i></i>'}<span>${esc(it.label)}</span>${it.app ? `<small>${esc(it.app.pkg)}</small>` : ''}</li>`).join('') || `<li class="mut">${t('noResults')}</li>`;
    $$('li[data-i]', ul).forEach((li) => { li.onmousedown = (e) => { e.preventDefault(); go(palItems[+li.dataset.i], e.metaKey || e.ctrlKey); }; });
    const sel = $('li.sel', ul); sel && sel.scrollIntoView({ block: 'nearest' });
  }
  function go(it, newTab) {
    if (!it) return;
    closePal();
    if (it.action) return it.action();
    if (newTab) window.open(it.url, '_blank'); else location.href = it.url;
  }
  function openPal() {
    pal.hidden = false;
    pal.innerHTML = `<div class="box"><input id="pi" placeholder="${t('palPlaceholder')}"><ul id="pl"></ul><div class="mut small hint">${t('palHint')}${S.apps.length ? '' : t('palNoApps')}</div></div>`;
    const inp = root.getElementById('pi');
    palSel = 0; renderPal('');
    inp.oninput = () => { palSel = 0; renderPal(inp.value); };
    inp.onkeydown = (e) => {
      if (e.key === 'ArrowDown') { palSel = Math.min(palSel + 1, palItems.length - 1); renderPal(inp.value); e.preventDefault(); }
      else if (e.key === 'ArrowUp') { palSel = Math.max(palSel - 1, 0); renderPal(inp.value); e.preventDefault(); }
      else if (e.key === 'Enter') { go(palItems[palSel], e.metaKey || e.ctrlKey); e.preventDefault(); }
      else if (e.key === 'Escape') { closePal(); e.preventDefault(); }
      e.stopPropagation();
    };
    pal.onmousedown = (e) => { if (e.target === pal) closePal(); };
    setTimeout(() => inp.focus(), 0);
  }
  function closePal() { pal.hidden = true; pal.innerHTML = ''; }

  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'k') {
      e.preventDefault(); e.stopPropagation();
      pal.hidden ? openPal() : closePal();
    } else if (e.key === 'Escape') {
      if (!pal.hidden) closePal(); else if (S.bell) { S.bell = false; renderPanel(); } else if (!panel.hidden) setView(false);
    }
  }, true);

  // ---------- FAB ----------
  function renderFab() {
    fab.innerHTML = `<button id="fb1" title="${t('fabTitle')}">${t('fab')}</button><button id="fb2" title="${t('quickNav')}">${KEYS.K}</button>`;
    root.getElementById('fb1').onclick = () => { if (isHome()) setView(true); else { store.set('pcp:autoOpen', true); location.href = base() + '/home'; } };
    root.getElementById('fb2').onclick = () => openPal();
  }
  renderFab();
  function setLang(l) { LANG = l; store.set('pcp:lang', l); renderFab(); if (!panel.hidden) renderPanel(); }

  // ---------- route handling ----------
  let lastPath = '';
  async function onRoute() {
    if (location.pathname === lastPath) return;
    lastPath = location.pathname;
    if (!base()) { fab.hidden = true; return; }
    fab.hidden = false;
    const g = await store.getSync(gKey());
    if (g && g.groups) S.G = { groups: g.groups, map: g.map || {}, order: g.order || [], noneCollapsed: !!g.noneCollapsed };
    const so = await store.get('pcp:sort'); if (so && so.k) S.sort = so;
    const lf = await store.get(lifeKey()); if (lf) S.life = lf;
    const md = await store.get('pcp:mode'); if (md === 'life' || md === '28') S.mode = md;
    const cached = await store.get('pcp:apps:' + devId());
    if (cached && !S.apps.length) { S.apps = cached.apps; S.updatedAt = cached.at; S.periodDays = cached.periodDays || ''; }
    if (isHome()) {
      if (S.autoOpen) togglePanel(true);
      refresh();
    } else if (!panel.hidden) togglePanel(false);
  }

  (async () => {
    S.dark = !!(await store.get('pcp:dark'));
    const lg = await store.get('pcp:lang'); if (lg === 'tr' || lg === 'en') { LANG = lg; renderFab(); }
    const ao = await store.get('pcp:autoOpen');
    S.autoOpen = ao !== false;
    applyDark();
    onRoute();
    setInterval(onRoute, 500);
  })();

  // ---------- styles ----------
  function CSS() {
    return `
    :host{--bg:#fff;--bg2:#f6f7f9;--fg:#1d2228;--mut:#6b7380;--line:#e4e7ec;--acc:#01875f;--acc2:#e6f4ef;--red:#c5221f;--red2:#fce8e6;--amb:#b06000;--amb2:#fef3e0;--blue:#1a73e8;--sh:0 10px 40px rgba(0,0,0,.18);
    }
    #fab,#panel,#pal{font:13px/1.4 "Google Sans Text","Google Sans",Roboto,system-ui,-apple-system,"Segoe UI",Arial,sans-serif;color:var(--fg);-webkit-font-smoothing:antialiased}
    button,input{font-family:inherit}
    :host([data-theme=dark]){--bg:#1b1d21;--bg2:#24272c;--fg:#e8eaed;--mut:#9aa0a6;--line:#33363c;--acc:#4fd1a1;--acc2:#18392e;--red:#f28b82;--red2:#3c1f1e;--amb:#fdd663;--amb2:#3a3018;--blue:#8ab4f8;--sh:0 10px 40px rgba(0,0,0,.6)}
    *{box-sizing:border-box}
    a{color:inherit;text-decoration:none}
    [hidden]{display:none!important}
    #fab{position:fixed;right:18px;bottom:18px;display:flex;gap:6px;pointer-events:auto}
    #fab button{border:1px solid var(--line);background:var(--bg);color:var(--fg);border-radius:10px;height:36px;min-width:40px;padding:0 10px;font-weight:600;font-size:13px;cursor:pointer;box-shadow:0 2px 10px rgba(0,0,0,.15)}
    #fab button:hover{border-color:var(--acc);color:var(--acc)}
    #panel{position:fixed;inset:0;background:var(--bg2);pointer-events:auto;display:flex;flex-direction:column;overflow:hidden}
    .top{display:flex;align-items:center;gap:10px;padding:10px 16px;background:var(--bg);border-bottom:1px solid var(--line)}
    .ttl{font-weight:600;font-size:15px;white-space:nowrap}.ttl span{color:var(--acc)}
    #q{width:220px;height:32px;border:1px solid var(--line);border-radius:8px;padding:0 10px;background:var(--bg2);color:var(--fg);font-size:13px}
    #q:focus{outline:2px solid var(--acc);border-color:transparent}
    .chips{display:flex;gap:6px}.chip{border:1px solid var(--line);background:var(--bg);color:var(--fg);border-radius:16px;height:28px;padding:0 12px;font-size:13px;cursor:pointer}
    .chip.on{background:var(--acc2);border-color:var(--acc);color:var(--acc);font-weight:600}
    .sp{flex:1}.ib{border:0;background:transparent;color:var(--fg);width:32px;height:32px;border-radius:8px;font-size:16px;cursor:pointer}.ib:hover{background:var(--bg2)}
    .mut{color:var(--mut)}.small{font-size:12px}
    .seg{display:flex;border:1px solid var(--line);border-radius:8px;overflow:hidden;flex:none}
    .seg button{border:0;background:var(--bg);color:var(--fg);height:28px;padding:0 10px;font-size:12px;cursor:pointer;white-space:nowrap}
    .seg button+button{border-left:1px solid var(--line)}.seg button.on{background:var(--acc2);color:var(--acc);font-weight:600}
    .tip{position:relative;display:inline-flex;align-items:center;gap:4px;cursor:help}
    .tip i{font-style:normal;font-size:10px;width:14px;height:14px;border-radius:50%;border:1px solid currentColor;display:inline-flex;align-items:center;justify-content:center;opacity:.55}
    .tip:hover::after{content:attr(data-tip);position:absolute;top:calc(100% + 6px);left:50%;transform:translateX(-50%);width:260px;white-space:normal;text-align:left;
      background:var(--fg);color:var(--bg);font-size:12px;font-weight:400;line-height:1.45;padding:8px 10px;border-radius:8px;box-shadow:var(--sh);z-index:50;pointer-events:none}
    th.n .tip:hover::after{left:auto;right:-8px;transform:none}
    .card .tip:hover::after{left:0;transform:none}
    .tw{position:relative}
    table thead th{z-index:4}
    .top{flex-wrap:wrap;row-gap:8px}.chip,.btn{white-space:nowrap}
    .cards{grid-template-columns:repeat(auto-fit,minmax(170px,1fr))!important}
    .spin{display:inline-block;width:12px;height:12px;border:2px solid var(--line);border-top-color:var(--acc);border-radius:50%;animation:pcpspin .8s linear infinite}
    @keyframes pcpspin{to{transform:rotate(360deg)}}
    .cards{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;padding:12px 16px 0}
    .card{background:var(--bg);border:1px solid var(--line);border-radius:10px;padding:10px 12px}
    .card .k{color:var(--mut);font-size:12px}.card .v{font-weight:600;font-size:22px;margin-top:2px}.card .v small{font-size:12px;color:var(--mut)}.card .s{color:var(--mut);font-size:11px}
    .card.warn{border-color:var(--amb);background:var(--amb2)}
    .alerts{display:flex;flex-wrap:wrap;gap:6px;padding:10px 16px 0}
    .al{border-radius:8px;padding:5px 10px;font-size:12px;border:1px solid transparent}
    .al.l3,.tag.l3{background:var(--red2);color:var(--red);border-color:var(--red)}
    .al.l2,.tag.l2{background:var(--amb2);color:var(--amb);border-color:var(--amb)}
    .al.l1,.tag.l1{background:var(--bg);color:var(--fg);border-color:var(--line)}
    .tag.l0{background:var(--bg2);color:var(--mut);border-color:var(--line)}
    .al:hover,.tag:hover{filter:brightness(.95);text-decoration:underline}
    .tw{flex:1;overflow:auto;margin:12px 16px 0;background:var(--bg);border:1px solid var(--line);border-radius:10px}
    table{width:100%;border-collapse:collapse}
    th{position:sticky;top:0;background:var(--bg);text-align:left;font-weight:600;color:var(--mut);font-size:12px;padding:8px 10px;border-bottom:1px solid var(--line);cursor:pointer;white-space:nowrap;user-select:none;z-index:1}
    th.on{color:var(--fg)}th:last-child{cursor:default}
    td{padding:6px 10px;border-bottom:1px solid var(--line);vertical-align:middle}
    tr:hover td{background:var(--bg2)}
    .n{text-align:right;white-space:nowrap}
    td.app a{display:flex;align-items:center;gap:10px}
    td.app img,td.app i{width:32px;height:32px;border-radius:8px;flex:none;background:var(--bg2)}
    td.app span{display:flex;flex-direction:column;min-width:0}td.app b{font-weight:600}td.app small{color:var(--mut);font-size:11px}
    td.app a:hover b{color:var(--acc)}
    .st{display:inline-block;border-radius:6px;padding:2px 8px;font-size:12px;white-space:nowrap;background:var(--bg2)}
    .st.live{background:var(--acc2);color:var(--acc)}.st.test{color:var(--blue)}.st.bad{background:var(--red2);color:var(--red)}
    .iss{max-width:260px}.tag{display:inline-block;border:1px solid;border-radius:6px;padding:1px 7px;margin:1px 4px 1px 0;font-size:11px;white-space:nowrap}
    .d{font-size:11px;margin-left:4px}.d.up{color:var(--acc)}.d.down{color:var(--red)}
    td.n .d{margin-left:4px}
    .lnk{white-space:nowrap}.lnk a{font-size:12px;color:var(--blue);margin-right:10px}.lnk a:hover{text-decoration:underline}
    .btn{border:1px solid var(--line);background:var(--bg);color:var(--fg);border-radius:8px;height:30px;padding:0 12px;font-size:13px;font-weight:600;cursor:pointer}
    .btn:hover{border-color:var(--acc);color:var(--acc)}.btn.ghost{font-weight:400}
    #panel{position:fixed}
    .bulk{position:absolute;left:50%;bottom:44px;transform:translateX(-50%);z-index:5;display:flex;align-items:center;gap:8px;padding:8px 12px;background:var(--bg);border:1px solid var(--acc);border-radius:12px;box-shadow:var(--sh);white-space:nowrap}
    .btn.prim{background:var(--acc);border-color:var(--acc);color:#fff}.btn.prim:hover{filter:brightness(1.1);color:#fff}
    :host([data-theme=dark]) .btn.prim{color:#111}
    /* manually fetched rows: accent bar + soft diagonal stripes on the number cells + time badge */
    tr.ar.fetched td{background-color:color-mix(in srgb,var(--acc) 4%,transparent)}
    tr.ar.fetched td.n{background-image:repeating-linear-gradient(135deg,color-mix(in srgb,var(--acc) 13%,transparent) 0 2px,transparent 2px 9px)}
    tr.ar.fetched td.cb{box-shadow:inset 3px 0 0 var(--acc)}
    tr.ar.fetched:hover td{background-color:color-mix(in srgb,var(--acc) 9%,transparent)}
    td.app span.fbadge,td.app small span{display:inline-block}
    .fbadge{display:inline-block;margin-left:6px;padding:0 6px;border-radius:999px;background:var(--acc2);color:var(--acc);font-size:10px;font-weight:600;line-height:16px;vertical-align:1px;cursor:help}
    tr.ar.busy td.n{background-image:linear-gradient(90deg,transparent,color-mix(in srgb,var(--acc) 10%,transparent),transparent);background-size:200% 100%;animation:pcpshim 1.2s linear infinite}
    @keyframes pcpshim{from{background-position:100% 0}to{background-position:-100% 0}}
    tr.ar.flash td{animation:pcpflash 2s ease-out}
    @keyframes pcpflash{0%,25%{background-color:color-mix(in srgb,var(--acc) 28%,transparent)}100%{background-color:color-mix(in srgb,var(--acc) 4%,transparent)}}
    #toast{position:fixed;top:64px;left:16px;z-index:20;pointer-events:none;display:flex;flex-direction:column;gap:8px;
      font:13px/1.4 "Google Sans Text","Google Sans",Roboto,system-ui,-apple-system,"Segoe UI",Arial,sans-serif;color:var(--fg);animation:pcptin .2s ease-out}
    #toast.out{animation:pcptout .25s ease-in forwards}
    @keyframes pcptin{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
    @keyframes pcptout{to{opacity:0;transform:translateY(-6px)}}
    #toast .tl{display:flex;gap:10px;align-items:flex-start;min-width:240px;max-width:320px;background:var(--bg);border:1px solid var(--line);border-radius:12px;box-shadow:var(--sh);padding:10px 12px}
    #toast .spin{margin-top:2px;flex:none}
    #toast .tt{display:flex;flex-direction:column;gap:2px;flex:1;min-width:0}
    #toast .tt b{font-weight:600;font-size:13px}
    #toast .tt small{color:var(--mut);font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    #toast .bar{height:3px;border-radius:2px;background:var(--line);margin-top:6px;overflow:hidden}
    #toast .bar i{display:block;height:100%;background:var(--acc);transition:width .3s}
    .vsep{width:1px;height:22px;background:var(--line)}
    .fail{font-size:11px;color:var(--amb);border:1px dashed var(--amb);border-radius:6px;padding:1px 6px;cursor:help;white-space:nowrap}
    .btn.on{background:var(--acc2);border-color:var(--acc);color:var(--acc)}
    .card.click{cursor:pointer}.card.click:hover{border-color:var(--amb)}
    .nw{white-space:nowrap}
    .bellw{position:relative}
    .ib.lang{font-size:11px;font-weight:700;letter-spacing:.5px;border:1px solid var(--line);width:34px;height:26px}
    .bell{position:relative;display:inline-flex;align-items:center;justify-content:center}.bell.act{background:var(--bg2)}
    .cnt{position:absolute;top:1px;right:0;min-width:16px;height:16px;border-radius:8px;background:var(--amb);color:#fff;font-size:10px;font-weight:700;line-height:16px;padding:0 4px}
    .cnt.red{background:var(--red)}
    :host([data-theme=dark]) .cnt{color:#111}
    .ndrop{position:absolute;right:0;top:40px;width:400px;max-height:70vh;overflow:auto;background:var(--bg);border:1px solid var(--line);border-radius:12px;box-shadow:var(--sh);z-index:10;padding:6px}
    .nh{display:flex;align-items:baseline;justify-content:space-between;padding:8px 10px 10px;border-bottom:1px solid var(--line);margin-bottom:4px}
    .ni{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:8px;position:relative}
    .ni:hover{background:var(--bg2)}
    .ni img,.ni i{width:28px;height:28px;border-radius:7px;flex:none;background:var(--bg2)}
    .ni span{display:flex;flex-direction:column;min-width:0;flex:1}.ni b{font-weight:600}.ni small{color:var(--mut);font-size:12px}
    .ni em{width:8px;height:8px;border-radius:50%;flex:none}
    .ni.l3 em{background:var(--red)}.ni.l3 small{color:var(--red)}.ni.l2 em{background:var(--amb)}.ni.l1 em{background:var(--mut)}
    tr.ar.ins-b td{box-shadow:inset 0 2px 0 var(--acc)}tr.ar.ins-a td{box-shadow:inset 0 -2px 0 var(--acc)}
    .bulk select{height:30px;border:1px solid var(--line);border-radius:8px;background:var(--bg);color:var(--fg);padding:0 8px;font-size:13px}
    th.cb,td.cb{width:34px;padding-right:0;cursor:default}
    input[type=checkbox]{width:15px;height:15px;accent-color:var(--acc);cursor:pointer;vertical-align:middle}
    tr.ar a,tr.ar img{-webkit-user-drag:none;user-drag:none}
    tr.ar{cursor:default}tr.ar[draggable=true]:active{cursor:grabbing}
    tr.gh td{background:var(--bg2);padding:0;border-bottom:1px solid var(--line);position:sticky;top:33px;z-index:1}
    tr.gh:hover td{background:var(--bg2)}
    .ghi{display:flex;align-items:center;gap:10px;padding:7px 10px}
    .ghi .gn{font-size:14px;cursor:pointer;user-select:none}
    .tg{border:0;background:transparent;color:var(--fg);width:22px;height:22px;border-radius:6px;cursor:pointer;font-size:13px}.tg:hover{background:var(--line)}
    .gact{display:flex;gap:2px;opacity:0;transition:opacity .15s}.gh:hover .gact{opacity:1}
    .gact button{border:0;background:transparent;color:var(--mut);width:26px;height:26px;border-radius:6px;cursor:pointer;font-size:13px}.gact button:hover{background:var(--line);color:var(--fg)}
    tbody.grp+tbody.grp tr.gh td{border-top:6px solid var(--bg)}
    .dragging tbody.grp.over tr.gh td{background:var(--acc2);box-shadow:inset 0 0 0 2px var(--acc)}
    .dragging tbody.grp.over tr.ar td{background:var(--acc2)}
    tr.empty-g td{padding:10px 44px}
    .empty{padding:30px;text-align:center;color:var(--mut)}
    .foot{padding:8px 16px}kbd{border:1px solid var(--line);border-radius:4px;padding:0 4px;font:11px monospace;background:var(--bg)}
    #pal{position:fixed;inset:0;z-index:30;background:rgba(0,0,0,.35);pointer-events:auto;display:flex;justify-content:center;align-items:flex-start;padding-top:12vh}
    .box{width:min(640px,92vw);background:var(--bg);border-radius:12px;box-shadow:var(--sh);overflow:hidden;border:1px solid var(--line)}
    #pi{width:100%;height:50px;border:0;border-bottom:1px solid var(--line);padding:0 16px;font-size:15px;background:var(--bg);color:var(--fg);outline:none}
    #pl{list-style:none;margin:0;padding:6px;max-height:52vh;overflow:auto}
    #pl li{display:flex;align-items:center;gap:10px;padding:7px 10px;border-radius:8px;cursor:pointer}
    #pl li img,#pl li i{width:22px;height:22px;border-radius:5px;flex:none;background:var(--bg2)}
    #pl li span{flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    #pl li small{color:var(--mut);font-size:11px}
    #pl li .pic{width:22px;height:22px;border-radius:5px;flex:none;display:flex;align-items:center;justify-content:center;background:var(--bg2);color:var(--mut)}
    #pl li.sel .pic{background:var(--bg);color:var(--acc)}
    #pl li.sel{background:var(--acc2)}#pl li.sel span{color:var(--acc);font-weight:600}
    .hint{padding:8px 14px;border-top:1px solid var(--line)}
    @media (max-width:1100px){.cards{grid-template-columns:repeat(3,1fr)}}
    `;
  }
})();
