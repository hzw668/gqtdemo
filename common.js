/* 广企通 · 一户一表 CRM 移动端 Demo 公共脚本 */

function applyFilter(container, filter) {
  if (!container || !filter) return;
  const list = container.querySelector('[data-filter-list]');
  if (!list) return;
  let visibleCount = 0;
  list.querySelectorAll('[data-status]').forEach(item => {
    const show = filter === 'all' || item.dataset.status === filter;
    item.style.display = show ? '' : 'none';
    if (show) visibleCount++;
  });
  const empty = container.querySelector('[data-filter-empty]');
  if (empty) empty.style.display = visibleCount === 0 ? '' : 'none';
}

function initFilterBars(root) {
  const scope = root || document;
  scope.querySelectorAll('.filter-bar').forEach(bar => {
    const container = bar.closest('.view, .sub-view, .standalone-page') || scope.querySelector('.app-body');
    bar.querySelectorAll('.filter-chip').forEach(chip => {
      if (chip.tagName === 'BUTTON' && !chip.type) chip.type = 'button';
      chip.addEventListener('click', (e) => {
        e.stopPropagation();
        bar.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        applyFilter(container, chip.dataset.filter);
      });
    });
    const activeChip = bar.querySelector('.filter-chip.active');
    if (activeChip) applyFilter(container, activeChip.dataset.filter);
  });
}

function initTodoPanels() {
  document.querySelectorAll('[data-todo-home]').forEach(home => {
    const panel = home.querySelector('[data-todo-panel]');
    const cards = home.querySelectorAll('[data-todo-type]');
    const lists = home.querySelectorAll('[data-todo-list]');
    let activeType = null;

    function selectType(type) {
      activeType = type;
      cards.forEach(c => c.classList.toggle('selected', c.dataset.todoType === type));
      if (panel) panel.hidden = false;
      lists.forEach(l => { l.hidden = l.dataset.todoList !== type; });
    }

    cards.forEach(card => {
      card.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        selectType(card.dataset.todoType);
        requestAnimationFrame(() => {
          panel?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
      });
    });

    home._resetTodoPanel = () => {
      activeType = null;
      cards.forEach(c => c.classList.remove('selected'));
      if (panel) panel.hidden = true;
      lists.forEach(l => { l.hidden = true; });
    };

    home._restoreTodoPanel = () => {
      if (activeType) selectType(activeType);
    };
  });
}

function initApp(config) {
  const tabs = document.querySelectorAll('.tab-item[data-tab]');
  const views = document.querySelectorAll('.view[data-tab]');
  const backBtn = document.querySelector('.header-back');
  const titleEl = document.querySelector('.app-title');
  const subtitleEl = document.querySelector('.app-subtitle');
  const defaultTitle = titleEl ? titleEl.textContent : '';
  const defaultSubtitle = subtitleEl ? subtitleEl.textContent : '';

  let currentTab = config.defaultTab || 'home';
  let subPage = null;
  const subStack = [];

  function showTab(tabId) {
    const prevTab = currentTab;
    currentTab = tabId;
    subPage = null;
    subStack.length = 0;
    tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === tabId));
    views.forEach(v => v.classList.toggle('active', v.dataset.tab === tabId));
    document.querySelectorAll('.sub-view').forEach(v => v.classList.remove('active'));
    if (backBtn) backBtn.classList.remove('show');
    if (titleEl) titleEl.textContent = defaultTitle;
    if (subtitleEl) subtitleEl.textContent = defaultSubtitle;
    const activeView = document.querySelector(`.view[data-tab="${tabId}"]`);
    const activeBar = activeView?.querySelector('.filter-bar');
    if (activeBar) {
      const activeChip = activeBar.querySelector('.filter-chip.active');
      applyFilter(activeView, activeChip?.dataset.filter || 'all');
    }
    if (prevTab === 'home' && tabId !== 'home') {
      document.querySelector('[data-todo-home]')?._resetTodoPanel?.();
    }
    if (tabId === 'home') {
      document.querySelector('[data-todo-home]')?._restoreTodoPanel?.();
    }
    window.scrollTo(0, 0);
  }

  function showSubPage(pageId, title, subtitle, noPush) {
    if (!noPush && subPage) {
      subStack.push({
        id: subPage,
        title: titleEl ? titleEl.textContent : '',
        subtitle: subtitleEl ? subtitleEl.textContent : ''
      });
    }
    subPage = pageId;
    document.querySelectorAll('.view[data-tab]').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.sub-view').forEach(v => v.classList.remove('active'));
    const page = document.getElementById(pageId);
    if (page) page.classList.add('active');
    if (backBtn) backBtn.classList.add('show');
    if (titleEl && title) titleEl.textContent = title;
    if (subtitleEl) subtitleEl.textContent = subtitle || '';
    window.scrollTo(0, 0);
  }

  function goBack() {
    if (subStack.length) {
      const prev = subStack.pop();
      showSubPage(prev.id, prev.title, prev.subtitle, true);
      return;
    }
    if (subPage) {
      showTab(currentTab);
    }
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => showTab(tab.dataset.tab));
  });

  if (backBtn) backBtn.addEventListener('click', goBack);

  document.querySelectorAll('[data-goto]').forEach(el => {
    el.addEventListener('click', () => {
      const d = el.dataset;
      showSubPage(d.goto, d.title, d.subtitle || '');
    });
  });

  initFilterBars();
  initTodoPanels();

  showTab(currentTab);
  return { showTab, showSubPage, goBack };
}

function initStandalonePage() {
  initFilterBars();
  initTodoPanels();
}

function initStandaloneNav(config) {
  const backBtn = document.querySelector('.header-back');
  const titleEl = document.querySelector('.app-title');
  const subtitleEl = document.querySelector('.app-subtitle');
  const mainView = document.getElementById(config?.mainViewId);
  const defaultTitle = config?.defaultTitle ?? (titleEl ? titleEl.textContent : '');
  const defaultSubtitle = config?.defaultSubtitle ?? (subtitleEl ? subtitleEl.textContent : '');
  const backHref = config?.backHref || '';
  let subStack = [];

  function activeSubView() {
    return document.querySelector('.sub-view.active');
  }

  function showMain() {
    subStack = [];
    document.querySelectorAll('.sub-view').forEach(v => v.classList.remove('active'));
    if (mainView) mainView.style.display = '';
    if (backBtn) {
      backBtn.href = backHref;
      backBtn.classList.toggle('show', !!backHref);
      backBtn.onclick = null;
    }
    if (titleEl) titleEl.textContent = defaultTitle;
    if (subtitleEl) subtitleEl.textContent = defaultSubtitle;
    window.scrollTo(0, 0);
  }

  function showSubPage(pageId, title, subtitle, noPush) {
    const current = activeSubView();
    if (!noPush && current) {
      subStack.push({
        id: current.id,
        title: titleEl ? titleEl.textContent : '',
        subtitle: subtitleEl ? subtitleEl.textContent : ''
      });
    } else if (!noPush && mainView && mainView.style.display !== 'none') {
      subStack.push({ id: null, title: defaultTitle, subtitle: defaultSubtitle });
    }
    if (mainView) mainView.style.display = 'none';
    document.querySelectorAll('.sub-view').forEach(v => v.classList.remove('active'));
    document.getElementById(pageId)?.classList.add('active');
    if (backBtn) {
      backBtn.classList.add('show');
      backBtn.onclick = (e) => {
        e.preventDefault();
        goBack();
      };
    }
    if (titleEl && title) titleEl.textContent = title;
    if (subtitleEl) subtitleEl.textContent = subtitle || '';
    window.scrollTo(0, 0);
  }

  function goBack() {
    if (subStack.length) {
      const prev = subStack.pop();
      if (!prev.id) {
        showMain();
        if (titleEl) titleEl.textContent = prev.title;
        if (subtitleEl) subtitleEl.textContent = prev.subtitle;
        return;
      }
      showSubPage(prev.id, prev.title, prev.subtitle, true);
      return;
    }
    if (activeSubView()) {
      showMain();
      return;
    }
    if (backHref) window.location.href = backHref;
  }

  document.querySelectorAll('[data-goto]').forEach(el => {
    if (el.dataset.boundGoto) return;
    el.dataset.boundGoto = '1';
    el.addEventListener('click', () => {
      const d = el.dataset;
      showSubPage(d.goto, d.title, d.subtitle || '');
    });
  });

  showMain();
  return { showMain, showSubPage, goBack };
}

function initDemandSection(root) {
  const scope = root || document;
  scope.querySelectorAll('.demand-section').forEach(section => {
    const toggle = section.querySelector('.demand-toggle');
    if (!toggle || toggle.dataset.bound) return;
    toggle.dataset.bound = '1';

    const sync = () => {
      section.classList.toggle('demand-section--readonly', !toggle.checked);
      section.querySelectorAll('.demand-fields textarea').forEach(el => {
        el.readOnly = !toggle.checked;
      });
      updateFollowSummary();
    };

    toggle.addEventListener('change', sync);
    sync();
  });
}

function initOptionChips(root) {
  const scope = root || document;
  scope.querySelectorAll('.chip-group').forEach(group => {
    group.querySelectorAll('.option-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        if (chip.closest('.demand-section--readonly')) return;
        if (group.dataset.single !== undefined) {
          group.querySelectorAll('.option-chip').forEach(c => c.classList.remove('active'));
          chip.classList.add('active');
        } else {
          chip.classList.toggle('active');
        }
        if (group.closest('#page-follow-form, .follow-form')) updateFollowSummary();
        if (group.closest('#page-roadshow, .roadshow-form')) updateRoadshowSummary();
        if (group.closest('.roadshow-apply-form')) updateRoadshowApplySummary();
        if (group.closest('.roadshow-config-form')) {
          updateRoadshowConfigNote(group.closest('.roadshow-config-form'));
        }
      });
    });
  });
}

function updateFollowSummary() {
  const form = document.getElementById('page-follow-form') || document.querySelector('.follow-form');
  const summaryEl = document.getElementById('follow-summary');
  if (!form || !summaryEl) return;

  const pick = (key) => {
    const group = form.querySelector(`[data-summary="${key}"]`);
    if (!group) return [];
    return [...group.querySelectorAll('.option-chip.active')].map(c => c.dataset.value);
  };

  const visitType = pick('visitType')[0] || '—';
  const scale = pick('scale')[0] || '—';
  const needs = pick('needs');
  const feedback = pick('feedback');
  const products = pick('products');
  const nextAction = pick('nextAction')[0] || '—';
  const demandEnabled = form.querySelector('.demand-toggle')?.checked;
  const demandSystem = demandEnabled ? pick('demandSystem') : [];
  const featureDemands = demandEnabled ? pick('featureDemands') : [];
  const note = form.querySelector('[data-follow-note="extra"]')?.value.trim();
  const featureNote = demandEnabled
    ? form.querySelector('[data-follow-note="featureDemand"]')?.value.trim()
    : '';

  const parts = [
    `${visitType}，企业规模 ${scale}`,
    needs.length ? `业务意向：${needs.join('、')}` : '',
    feedback.length ? `反馈：${feedback.join('、')}` : '',
    products.length ? `已推介：${products.join('、')}` : '',
    `下次${nextAction}`
  ].filter(Boolean);

  let demandPart = '';
  if (demandSystem.length || featureDemands.length || featureNote) {
    const tags = [];
    if (demandSystem.length && featureDemands.length) {
      tags.push(`${demandSystem.join('、')}·${featureDemands.join('、')}`);
    } else if (demandSystem.length) {
      tags.push(demandSystem.join('、'));
    } else if (featureDemands.length) {
      tags.push(featureDemands.join('、'));
    }
    const label = tags.length ? `功能诉求【${tags[0]}${tags.length > 1 ? '等' : ''}】` : '功能诉求';
    demandPart = featureNote ? `${label}：${featureNote}。（已同步需求池）` : `${label}。（已同步需求池）`;
  }

  const body = note ? `${parts.join('；')}。${demandPart ? demandPart + ' ' : ''}补充：${note}` : `${parts.join('；')}。${demandPart}`;
  summaryEl.textContent = body.trim();
}

function updateRoadshowSummary() {
  const form = document.getElementById('page-roadshow')?.querySelector('.roadshow-form')
    || document.querySelector('.roadshow-form');
  const summaryEl = document.getElementById('roadshow-summary');
  if (!form || !summaryEl) return;

  const pick = (key) => {
    const group = form.querySelector(`[data-roadshow="${key}"]`);
    if (!group) return [];
    return [...group.querySelectorAll('.option-chip.active')].map(c => c.dataset.value);
  };

  const note = (key) => form.querySelector(`[data-roadshow-note="${key}"]`)?.value.trim() || '';

  const roles = pick('roles');
  const corp = pick('corpProducts');
  const retail = pick('retailProducts');
  const tech = pick('techTopics');
  const feedback = pick('feedback');
  const result = pick('result')[0] || '—';
  const nextAction = pick('nextAction')[0] || '—';
  const extra = note('extra');

  const roleLine = (label, items, noteKey) => {
    const bits = [];
    if (items.length) bits.push(items.join('、'));
    const n = note(noteKey);
    if (n) bits.push(n);
    return bits.length ? `<strong>${label}</strong>：${bits.join('；')}` : '';
  };

  const parts = [
    roles.length ? `参与：${roles.join('、')}` : '',
    roleLine('对公', corp, 'corpProducts'),
    roleLine('零售', retail, 'retailProducts'),
    roleLine('科技', tech, 'techTopics'),
    feedback.length ? `客户${feedback.join('、')}` : '',
    `转化：${result}`,
    nextAction !== '—' ? `下次${nextAction}` : ''
  ].filter(Boolean);

  summaryEl.innerHTML = extra
    ? `${parts.join('。')}。补充：${extra}。`
    : `${parts.join('。')}。`;
}

function updateRoadshowApplySummary() {
  const form = document.querySelector('.roadshow-apply-form');
  const summaryEl = document.getElementById('apply-summary');
  if (!form || !summaryEl) return;

  const pick = (key) => {
    const group = form.querySelector(`[data-apply="${key}"]`);
    if (!group) return [];
    if (group.tagName === 'SELECT') return group.value ? [group.value] : [];
    return [...group.querySelectorAll('.option-chip.active')].map(c => c.dataset.value);
  };

  const customer = form.querySelector('[data-apply="customer"]')?.value || '—';
  const datetimeRaw = form.querySelector('[data-apply="datetime"]')?.value || '';
  const datetime = datetimeRaw
    ? datetimeRaw.replace('T', ' ').slice(0, 16)
    : '—';
  const format = pick('format')[0] || '—';
  const lines = pick('lines');
  const products = pick('products');
  const location = form.querySelector('[data-apply="location"]')?.value.trim();
  const extra = form.querySelector('[data-apply-note="extra"]')?.value.trim();

  const parts = [
    customer !== '—' ? `客户${customer}` : '',
    datetime !== '—' ? `预约 ${datetime} ${format}路演` : '',
    lines.length ? `协同${lines.join('、')}` : '',
    products.length ? `重点推介${products.join('、')}` : ''
  ].filter(Boolean);

  summaryEl.textContent = extra
    ? `${parts.join('；')}。补充：${extra}。`
    : `${parts.join('；')}。`;
}

function initRoadshowConfigForm(root) {
  const scope = root || document;
  scope.querySelectorAll('.roadshow-config-form').forEach(form => {
    if (form.dataset.boundConfig) return;
    form.dataset.boundConfig = '1';

    form.querySelectorAll('[data-config-datetime], [data-config-select]').forEach(el => {
      el.addEventListener('change', () => updateRoadshowConfigNote(form));
      el.addEventListener('input', () => updateRoadshowConfigNote(form));
    });

    updateRoadshowConfigNote(form);
  });
}

function updateRoadshowConfigNote(formEl) {
  const form = formEl || document.querySelector('.roadshow-config-form');
  if (!form) return;

  const noteEl = form.querySelector('[data-config-note]');
  if (!noteEl) return;

  const pickSingle = (key) => {
    const group = form.querySelector(`[data-config="${key}"]`);
    if (!group) return '';
    return group.querySelector('.option-chip.active')?.dataset.value || '';
  };

  const pickMulti = (key) => {
    const group = form.querySelector(`[data-config="${key}"]`);
    if (!group) return [];
    return [...group.querySelectorAll('.option-chip.active')].map(c => c.dataset.value);
  };

  const selectShort = (key) => {
    const sel = form.querySelector(`[data-config-select="${key}"]`);
    if (!sel?.value) return '';
    return sel.value.split('·')[0].trim();
  };

  const formatTime = () => {
    const input = form.querySelector('[data-config-datetime]');
    if (!input?.value) return '';
    return input.value.replace('T', ' ').slice(0, 16);
  };

  const kind = form.dataset.configForm || 'branch';
  let text = '';

  if (kind === 'branch') {
    const retail = selectShort('retail');
    const time = formatTime();
    const corp = pickSingle('corpSupport');
    const leader = pickSingle('leadership');
    const onsite = pickMulti('onsite');
    const parts = [];

    if (retail) parts.push(`已指派零售${retail}协同`);
    else parts.push('待指派零售协同人员');
    if (time) parts.push(`确定路演时间 ${time}`);

    if (corp === '产品专家到场') parts.push('对公产品专家到场支持');
    else if (corp === '远程支持') parts.push('对公产品专家远程支持');
    else if (corp) parts.push('对公产品无需额外支持');

    if (leader && leader !== '无需' && leader !== '无需行领导') {
      parts.push(`${leader}参与`);
    } else {
      parts.push('无需行领导参与');
    }

    if (onsite.length) parts.push(`现场安排${onsite.join('、')}`);

    text = `${parts.join('；')}。`;
  } else {
    const tech = selectShort('tech');
    const techFull = form.querySelector('[data-config-select="tech"]')?.value || '';
    const contents = pickMulti('techContent');
    const leader = pickSingle('leadership');
    const time = formatTime();
    const parts = [];

    if (techFull.includes('远程支持')) {
      parts.push('已安排金科部远程科技支持');
    } else if (tech) {
      parts.push(`科技${tech}已确认出席`);
    } else {
      parts.push('待指派科技支持人员');
    }

    if (contents.length) parts.push(`支持${contents.join('、')}`);

    if (time) parts.push(`确定路演时间 ${time}`);

    if (leader && leader !== '无需' && leader !== '无需行领导') {
      parts.push(`${leader}将协同出席`);
    } else {
      parts.push('无需行领导参与');
    }

    text = `${parts.join('；')}。`;
  }

  noteEl.value = text;
}
