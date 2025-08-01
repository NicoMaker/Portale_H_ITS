// js/alert_modal.js

function showCustomAlert(title, message, icon, onOkCallback) {
  const modal = document.getElementById("custom-alert-modal");
  document.getElementById("custom-alert-title").textContent = title;
  document.getElementById("custom-alert-message").textContent = message;
  document.getElementById("custom-alert-icon").textContent = icon;

  const okButton = document.getElementById("custom-alert-ok-button");

  // Clone the button to remove all previous event listeners
  const newOkButton = okButton.cloneNode(true);
  okButton.parentNode.replaceChild(newOkButton, okButton);

  newOkButton.onclick = () => {
    modal.style.display = "none";
    if (onOkCallback && typeof onOkCallback === "function") {
      onOkCallback();
    }
  };

  modal.style.display = "flex";
}
