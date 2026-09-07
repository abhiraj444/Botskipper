// Initialize popup elements
const currentTabDomainEl = document.getElementById('current-tab-domain');
const statusPill = document.getElementById('status-pill');
const btnTagSource = document.getElementById('btn-tag-source');
const btnTagTarget = document.getElementById('btn-tag-target');
const recordingBanner = document.getElementById('recording-banner');
const btnCancelRecording = document.getElementById('btn-cancel-recording');
const recipesListEl = document.getElementById('recipes-list');
const recipeCountEl = document.getElementById('recipe-count');

let activeTab = null;

async function init() {
  // Query current active tab
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  activeTab = tabs[0];

  if (activeTab && activeTab.url) {
    try {
      const url = new URL(activeTab.url);
      currentTabDomainEl.textContent = url.hostname;
    } catch (e) {
      currentTabDomainEl.textContent = activeTab.url;
    }
  } else {
    currentTabDomainEl.textContent = 'Chrome Internal Page';
    btnTagSource.disabled = true;
  }

  // Check ongoing recording status
  chrome.runtime.sendMessage({ type: 'GET_SESSION_STATUS' }, (res) => {
    if (res && res.isRecording) {
      setRecordingUI(true, res.currentSession.sourceUrl);
    } else {
      setRecordingUI(false);
    }
  });

  // Load all recipes
  loadSavedRecipes();
}

function setRecordingUI(isRecording, sourceUrl = '') {
  if (isRecording) {
    statusPill.textContent = 'RECORDING';
    statusPill.className = 'status-pill recording';
    recordingBanner.classList.remove('hidden');
    btnTagSource.disabled = true;
    btnTagTarget.disabled = false;
  } else {
    statusPill.textContent = 'READY';
    statusPill.className = 'status-pill idle';
    recordingBanner.classList.add('hidden');
    btnTagSource.disabled = !activeTab || !activeTab.url || activeTab.url.startsWith('chrome://');
    btnTagTarget.disabled = true;
  }
}

// 1. Tag Source Page
btnTagSource.addEventListener('click', async () => {
  if (!activeTab || !activeTab.id) return;

  btnTagSource.disabled = true;
  btnTagSource.querySelector('.btn-title').textContent = 'Capturing DOM...';

  // Ask content script to capture DOM
  chrome.tabs.sendMessage(activeTab.id, { type: 'CAPTURE_SOURCE_DOM' }, (response) => {
    if (chrome.runtime.lastError || !response) {
      alert('Could not capture page DOM. Please refresh the page and try again.');
      btnTagSource.disabled = false;
      btnTagSource.querySelector('.btn-title').textContent = '1. Tag Page as Source';
      return;
    }

    // Send snapshot to background worker
    chrome.runtime.sendMessage({
      type: 'START_SOURCE_RECORDING',
      tabId: activeTab.id,
      sourceUrl: response.url,
      domSnapshot: response.snapshot
    }, (res) => {
      btnTagSource.querySelector('.btn-title').textContent = '1. Tag Page as Source';
      if (res && res.status === 'recording_active') {
        setRecordingUI(true, response.url);
      }
    });
  });
});

// 2. Tag Target Download
btnTagTarget.addEventListener('click', async () => {
  if (!activeTab || !activeTab.id) return;

  btnTagTarget.disabled = true;
  btnTagTarget.querySelector('.btn-title').textContent = 'Analyzing Endpoints...';

  // Request target candidate from content script or use current URL
  chrome.tabs.sendMessage(activeTab.id, { type: 'CAPTURE_TARGET_ENDPOINT' }, (response) => {
    const targetUrl = response ? response.url : activeTab.url;

    chrome.runtime.sendMessage({
      type: 'TAG_TARGET_ENDPOINT',
      targetUrl: targetUrl
    }, (res) => {
      btnTagTarget.querySelector('.btn-title').textContent = '2. Tag Target Download Link';
      if (res && res.status === 'success') {
        alert(`🎉 Success! Direct bypass recipe generated for ${res.domain} with ${res.recipe.bindings.length} parameter bindings.`);
        setRecordingUI(false);
        loadSavedRecipes();
      } else {
        alert(`Failed to solve relationship: ${res ? res.message : 'Unknown error'}`);
        setRecordingUI(false);
      }
    });
  });
});

// Cancel recording
btnCancelRecording.addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'CANCEL_RECORDING' }, () => {
    setRecordingUI(false);
  });
});

// Load recipes
function loadSavedRecipes() {
  chrome.runtime.sendMessage({ type: 'GET_ALL_RECIPES' }, (res) => {
    if (!res || !res.recipes) return;
    const recipes = res.recipes;
    recipeCountEl.textContent = recipes.length;

    if (recipes.length === 0) {
      recipesListEl.innerHTML = '<div class="empty-state">No domain recipes saved yet. Tag a source page above to create one.</div>';
      return;
    }

    recipesListEl.innerHTML = '';
    recipes.forEach((recipe) => {
      const item = document.createElement('div');
      item.className = 'recipe-item';
      item.innerHTML = `
        <div class="recipe-info">
          <span class="recipe-domain">⚡ ${recipe.domain}</span>
          <span class="recipe-rules">${recipe.bindings.length} dynamic bindings • ${recipe.isThirdPartyHub ? 'External Host' : 'Direct API'}</span>
        </div>
        <button class="btn-delete-recipe" data-domain="${recipe.domain}" title="Delete Recipe">✕</button>
      `;
      recipesListEl.appendChild(item);
    });

    // Attach delete listeners
    document.querySelectorAll('.btn-delete-recipe').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const domain = e.target.getAttribute('data-domain');
        chrome.runtime.sendMessage({ type: 'DELETE_RECIPE', domain }, () => {
          loadSavedRecipes();
        });
      });
    });
  });
}

init();
