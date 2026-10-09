let pickerActive = false;
let hoveredElement = null;
let selectedElement = null;
const HIGHLIGHT_STYLE = "outline: 3px dashed #cf222e !important; background-color: rgba(207, 34, 46, 0.2) !important; cursor: crosshair !important;";
let originalInlineStyle = "";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "GET_PICKER_STATE") {
    sendResponse({ isPicking: pickerActive });
    return true;
  }

  if (message.action === "START_PICKER") {
    pickerActive = true;
    enableVisualInspector();
    return true;
  }

  if (message.action === "STOP_PICKER") {
    disableVisualInspector();
    return true;
  }

  if (message.action === "APPLY_ELEMENT_MODIFICATIONS" && selectedElement) {
    selectedElement.style.display = message.styles.display;
    selectedElement.style.opacity = message.styles.opacity;
    selectedElement.style.background = message.styles.background;

    if (selectedElement.tagName.toLowerCase() === 'iframe') {
      selectedElement.setAttribute('sandbox', message.sandboxString);
      const src = selectedElement.src;
      selectedElement.src = '';
      setTimeout(() => { selectedElement.src = src; }, 10);
    }
    sendResponse({ success: true });
    return true;
  }

  if (message.action === "DELETE_SELECTED_ELEMENT" && selectedElement) {
    selectedElement.remove();
    selectedElement = null;
    sendResponse({ success: true });
    return true;
  }
});

function enableVisualInspector() {
  document.addEventListener('mouseover', onMouseOver, true);
  document.addEventListener('mouseout', onMouseOut, true);
  document.addEventListener('click', onElementClick, true);
}

function disableVisualInspector() {
  pickerActive = false;
  if (hoveredElement) {
    hoveredElement.setAttribute('style', originalInlineStyle);
  }
  document.removeEventListener('mouseover', onMouseOver, true);
  document.removeEventListener('mouseout', onMouseOut, true);
  document.removeEventListener('click', onElementClick, true);
}

function onMouseOver(e) {
  if (!pickerActive) return;
  e.preventDefault();
  e.stopPropagation();

  hoveredElement = e.target;
  originalInlineStyle = hoveredElement.getAttribute('style') || "";
  hoveredElement.setAttribute('style', originalInlineStyle + ";" + HIGHLIGHT_STYLE);
}

function onMouseOut(e) {
  if (!pickerActive || !hoveredElement) return;
  hoveredElement.setAttribute('style', originalInlineStyle);
}

function onElementClick(e) {
  if (!pickerActive) return;
  e.preventDefault();
  e.stopPropagation();

  selectedElement = e.target;
  selectedElement.setAttribute('style', originalInlineStyle);
  disableVisualInspector();

  const computed = window.getComputedStyle(selectedElement);
  const sandboxAttr = selectedElement.getAttribute('sandbox') || "";

  chrome.runtime.sendMessage({
    action: "ELEMENT_CAPTURED",
    tagName: selectedElement.tagName,
    id: selectedElement.id || "keine",
    className: selectedElement.className || "keine",
    sandboxTokens: sandboxAttr.split(/\s+/).filter(t => t.length > 0),
    currentStyles: {
      display: computed.display,
      opacity: computed.opacity,
      background: computed.backgroundColor
    }
  });
}
