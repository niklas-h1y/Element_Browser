let isPicking = false;

document.addEventListener('DOMContentLoaded', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs || !tabs[0]) return;
    chrome.tabs.sendMessage(tabs[0].id, { action: "GET_PICKER_STATE" }, (response) => {
      if (response && response.isPicking) {
        togglePickerUI(true);
      }
    });
  });
});

document.getElementById('picker-btn').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs || !tabs[0]) return;
    
    isPicking = !isPicking;
    togglePickerUI(isPicking);

    chrome.tabs.sendMessage(tabs[0].id, { 
      action: isPicking ? "START_PICKER" : "STOP_PICKER" 
    });
    
    if (isPicking) window.close();
  });
});

function togglePickerUI(active) {
  const btn = document.getElementById('picker-btn');
  if (active) {
    btn.innerText = "🛑 Stop Picker Mode";
    btn.classList.add('active');
  } else {
    btn.innerText = "🎯 Select Element";
    btn.classList.remove('active');
  }
}

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "ELEMENT_CAPTURED") {
    isPicking = false;
    togglePickerUI(false);
    
    document.getElementById('modifier-controls').style.display = 'block';
    document.getElementById('apply-btn').style.display = 'block';
    document.getElementById('delete-btn').style.display = 'block';
    
    document.getElementById('target-info').innerText = `<${message.tagName.toLowerCase()} id="${message.id}" class="${message.className}">`;
    
    document.getElementById('style-display').value = message.currentStyles.display;
    document.getElementById('style-opacity').value = message.currentStyles.opacity;
    document.getElementById('style-bg').value = message.currentStyles.background;

    const sandboxSection = document.getElementById('iframe-sandbox-section');
    if (message.tagName.toLowerCase() === 'iframe') {
      sandboxSection.style.display = 'block';
      document.getElementById('allow-scripts').checked = message.sandboxTokens.includes('allow-scripts');
      document.getElementById('allow-same-origin').checked = message.sandboxTokens.includes('allow-same-origin');
    } else {
      sandboxSection.style.display = 'none';
    }
  }
});

document.getElementById('apply-btn').addEventListener('click', () => {
  const styleDisplay = document.getElementById('style-display').value;
  const styleOpacity = document.getElementById('style-opacity').value;
  const styleBg = document.getElementById('style-bg').value;
  
  let flags = [];
  if (document.getElementById('allow-scripts').checked) flags.push('allow-scripts');
  if (document.getElementById('allow-same-origin').checked) flags.push('allow-same-origin');
  const sandboxString = flags.join(' ');

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs || !tabs[0]) return;
    chrome.tabs.sendMessage(tabs[0].id, {
      action: "APPLY_ELEMENT_MODIFICATIONS",
      styles: { display: styleDisplay, opacity: styleOpacity, background: styleBg },
      sandboxString: sandboxString
    }, () => {
      alert("Changes applied!");
    });
  });
});

document.getElementById('delete-btn').addEventListener('click', () => {
  if (confirm("Delete this element permanently from the current view?")) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs || !tabs[0]) return;
      chrome.tabs.sendMessage(tabs[0].id, { action: "DELETE_SELECTED_ELEMENT" }, () => {
        document.getElementById('modifier-controls').style.display = 'none';
        document.getElementById('target-info').innerText = "Element deleted successfully!";
      });
    });
  }
});
