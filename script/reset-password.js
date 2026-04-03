document.addEventListener('DOMContentLoaded', () => {
  const resetPasswordForm = document.getElementById('resetPasswordForm');
  const resetTokenInput = document.getElementById('resetToken');
  const newPasswordInput = document.getElementById('newPassword');
  const confirmPasswordInput = document.getElementById('confirmPassword');
  const resetMessage = document.getElementById('resetMessage');

  const queryParams = new URLSearchParams(window.location.search);
  const token = String(queryParams.get('token') || '').trim();
  const state = String(queryParams.get('state') || '').trim();

  function showMessage(type, text) {
    if (!resetMessage) return;
    resetMessage.className = `message ${type}`;
    resetMessage.textContent = text;
    if (window.PlatformaToast) {
      window.PlatformaToast.showToast(type === 'success' ? 'success' : 'error', text);
    }
  }

  if (!token) {
    const text = state === 'missing'
      ? 'Mungon token-i i resetimit në link.'
      : 'Linku i resetimit është i pavlefshëm.';
    showMessage('error', text);
    resetPasswordForm?.setAttribute('hidden', 'hidden');
    return;
  }

  resetTokenInput.value = token;

  resetPasswordForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const newPassword = String(newPasswordInput?.value || '');
    const confirmPassword = String(confirmPasswordInput?.value || '');

    if (newPassword.length < 8) {
      showMessage('error', 'Fjalëkalimi i ri duhet të ketë të paktën 8 karaktere.');
      return;
    }

    if (newPassword !== confirmPassword) {
      showMessage('error', 'Fjalëkalimet nuk përputhen.');
      return;
    }

    try {
      await window.PlatformaApi.post('/api/auth/reset-password', {
        token: resetTokenInput.value,
        newPassword
      });

      showMessage('success', 'Fjalëkalimi u ndryshua me sukses. Tani mund të hyni.');
      resetPasswordForm.reset();
      setTimeout(() => {
        window.location.href = 'signin.html';
      }, 1400);
    } catch (error) {
      showMessage('error', error?.payload?.message || 'Nuk u arrit ndryshimi i fjalëkalimit.');
    }
  });
});
