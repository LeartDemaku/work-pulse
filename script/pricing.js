document.addEventListener('DOMContentLoaded', async function () {
  const tabButtons = document.querySelectorAll('.pricing-tab-btn');
  const pricingCards = document.querySelectorAll('.pricing-card');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.getAttribute('data-filter');

      pricingCards.forEach(card => {
        const category = card.getAttribute('data-category');
        if (filter === 'all' || category === filter) {
          card.style.display = 'flex';
          card.style.animation = 'modalSlideUp 0.3s ease';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  const modalBackdrop = document.getElementById('checkoutModal');
  const modalCloseBtn = document.getElementById('closeModalBtn');
  const selectPlanButtons = document.querySelectorAll('.select-plan-btn');
  const modalPlanTitle = document.getElementById('modalPlanTitle');
  const modalPlanSubtitle = document.getElementById('modalPlanSubtitle');
  const modalPlanPrice = document.getElementById('modalPlanPrice');
  const checkoutForm = document.getElementById('checkoutForm');
  const modalBody = document.querySelector('.modal-body');
  const modalFooter = document.querySelector('.modal-footer');
  const submitBtnText = document.getElementById('submitBtnText');

  let currentSelectedPlan = {
    id: 'base',
    title: 'Paketa Bazë',
    price: '30€',
    period: 'për ofertë pune'
  };

  const planData = {
    'base': {
      title: 'Paketa Bazë',
      subtitle: 'Oferta e vetme • Standarde 30 ditë',
      price: '30€',
      period: 'për ofertë'
    },
    'premium': {
      title: 'Paketa Premium',
      subtitle: 'Oferta + Promovim në rrjete & newsletter',
      price: '80€',
      period: 'për ofertë'
    },
    'subscription': {
      title: 'Abonim Mujor për Kompani',
      subtitle: 'Deri në 10 oferta aktive çdo kohë',
      price: '200€',
      period: '/muaj'
    },
    'enterprise': {
      title: 'Enterprise / Partner Paketë',
      subtitle: 'Integrim API ATS & Support VIP',
      price: '700€',
      period: '/muaj'
    }
  };

  function updateSubmitButtonLabel() {
    const selectedMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value || 'card';
    if (!submitBtnText) return;
    if (selectedMethod === 'card') {
      submitBtnText.textContent = `Paguaj ${currentSelectedPlan.price} me Kartelë Bankare`;
    } else if (selectedMethod === 'invoice') {
      submitBtnText.textContent = `Kërko Faturë me TVSH (${currentSelectedPlan.price})`;
    } else {
      submitBtnText.textContent = 'Dërgo Kërkesën për Kontakt';
    }
  }

  function openCheckoutModal(planId) {
    const data = planData[planId] || planData['base'];
    currentSelectedPlan = { id: planId, ...data };

    if (modalPlanTitle) modalPlanTitle.textContent = data.title;
    if (modalPlanSubtitle) modalPlanSubtitle.textContent = data.subtitle;
    if (modalPlanPrice) modalPlanPrice.textContent = data.price;

    const planInput = document.getElementById('selectedPlanInput');
    if (planInput) planInput.value = data.title;

    updateSubmitButtonLabel();

    if (modalBackdrop) {
      modalBackdrop.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeCheckoutModal() {
    if (modalBackdrop) {
      modalBackdrop.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  selectPlanButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      const planId = button.getAttribute('data-plan');
      openCheckoutModal(planId);
    });
  });

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', closeCheckoutModal);
  }

  if (modalBackdrop) {
    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) {
        closeCheckoutModal();
      }
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalBackdrop && modalBackdrop.classList.contains('active')) {
      closeCheckoutModal();
    }
  });

  const cardSection = document.getElementById('cardPaymentSection');
  const invoiceSection = document.getElementById('invoicePaymentSection');
  const contactSection = document.getElementById('contactPaymentSection');

  const paymentMethodCards = document.querySelectorAll('.payment-method-card');
  paymentMethodCards.forEach(card => {
    card.addEventListener('click', () => {
      paymentMethodCards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      const radio = card.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;

      const method = card.getAttribute('data-method') || (radio ? radio.value : 'card');
      if (cardSection) cardSection.style.display = method === 'card' ? 'flex' : 'none';
      if (invoiceSection) invoiceSection.style.display = method === 'invoice' ? 'block' : 'none';
      if (contactSection) contactSection.style.display = method === 'contact' ? 'block' : 'none';

      updateSubmitButtonLabel();
    });
  });

  const cardHolderInput = document.getElementById('cardHolderInput');
  const cardHolderDisplay = document.getElementById('cardHolderDisplay');
  const cardNumberInput = document.getElementById('cardNumberInput');
  const cardNumberDisplay = document.getElementById('cardNumberDisplay');
  const cardBrandLogo = document.getElementById('cardBrandLogo');
  const inputCardIcon = document.getElementById('inputCardIcon');
  const cardExpiryInput = document.getElementById('cardExpiryInput');
  const cardExpiryDisplay = document.getElementById('cardExpiryDisplay');
  const cardCvvInput = document.getElementById('cardCvvInput');

  if (cardHolderInput && cardHolderDisplay) {
    cardHolderInput.addEventListener('input', () => {
      const val = cardHolderInput.value.trim().toUpperCase();
      cardHolderDisplay.textContent = val.length > 0 ? val : 'EMRI MBIEMRI';
    });
  }

  if (cardNumberInput && cardNumberDisplay) {
    cardNumberInput.addEventListener('input', (e) => {
      let val = e.target.value.replace(/\D/g, '');
      if (val.length > 16) val = val.slice(0, 16);

      const parts = val.match(/.{1,4}/g);
      const formatted = parts ? parts.join(' ') : '';
      e.target.value = formatted;

      let brandIcon = '<i class="fas fa-credit-card"></i>';
      if (val.startsWith('4')) {
        brandIcon = '<i class="fab fa-cc-visa"></i>';
      } else if (/^(5[1-5]|2[2-7])/.test(val)) {
        brandIcon = '<i class="fab fa-cc-mastercard"></i>';
      } else if (/^3[47]/.test(val)) {
        brandIcon = '<i class="fab fa-cc-amex"></i>';
      }

      if (cardBrandLogo) cardBrandLogo.innerHTML = brandIcon;
      if (inputCardIcon) inputCardIcon.innerHTML = brandIcon;

      cardNumberDisplay.textContent = formatted.length > 0 ? formatted : '•••• •••• •••• ••••';
    });
  }

  if (cardExpiryInput && cardExpiryDisplay) {
    cardExpiryInput.addEventListener('input', (e) => {
      let val = e.target.value.replace(/\D/g, '');
      if (val.length > 4) val = val.slice(0, 4);

      if (val.length >= 2) {
        let month = parseInt(val.slice(0, 2), 10);
        if (month > 12) month = 12;
        if (month === 0) month = 1;
        const mStr = month < 10 && val.slice(0, 2).length === 2 ? ('0' + month).slice(-2) : val.slice(0, 2);
        val = mStr + (val.length > 2 ? '/' + val.slice(2) : '/');
      }
      e.target.value = val;
      cardExpiryDisplay.textContent = val.length > 0 ? val : 'MM/VV';
    });
  }

  if (cardCvvInput) {
    cardCvvInput.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4);
    });
  }

  if (checkoutForm) {
    checkoutForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      const formData = new FormData(checkoutForm);
      const companyName = formData.get('companyName') || '';
      const email = formData.get('email') || '';
      const phone = formData.get('phone') || '';
      const paymentMethod = formData.get('paymentMethod') || 'card';

      if (paymentMethod === 'card') {
        const rawCard = (cardNumberInput ? cardNumberInput.value : '').replace(/\D/g, '');
        const cardHolderVal = (cardHolderInput ? cardHolderInput.value : '').trim();
        const expiryVal = (cardExpiryInput ? cardExpiryInput.value : '').trim();
        const cvvVal = (cardCvvInput ? cardCvvInput.value : '').trim();

        if (!cardHolderVal) {
          if (window.PlatformaToast) {
            window.PlatformaToast.showToast('error', 'Ju lutemi shkruani emrin dhe mbiemrin e mbajtësit të kartelës.');
          } else {
            alert('Ju lutemi shkruani emrin dhe mbiemrin e mbajtësit të kartelës.');
          }
          cardHolderInput?.focus();
          return;
        }

        if (rawCard.length < 16) {
          if (window.PlatformaToast) {
            window.PlatformaToast.showToast('error', 'Numri i kartelës bankare duhet të ketë 16 shifra të sakta.');
          } else {
            alert('Numri i kartelës bankare duhet të ketë 16 shifra të sakta.');
          }
          cardNumberInput?.focus();
          return;
        }

        if (expiryVal.length < 4) {
          if (window.PlatformaToast) {
            window.PlatformaToast.showToast('error', 'Ju lutemi shkruani datën e vlefshme të skadimit (MM/VV).');
          } else {
            alert('Ju lutemi shkruani datën e vlefshme të skadimit (MM/VV).');
          }
          cardExpiryInput?.focus();
          return;
        }

        if (cvvVal.length < 3) {
          if (window.PlatformaToast) {
            window.PlatformaToast.showToast('error', 'Kodi i sigurisë CVV/CVC duhet të ketë të paktën 3 shifra.');
          } else {
            alert('Kodi i sigurisë CVV/CVC duhet të ketë të paktën 3 shifra.');
          }
          cardCvvInput?.focus();
          return;
        }
      }

      const submitBtn = checkoutForm.querySelector('button[type="submit"]') || document.getElementById('submitOrderBtn');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Duke u lidhur me serverin e bankës...';
      }

      await new Promise(resolve => setTimeout(resolve, 800));

      if (submitBtn && paymentMethod === 'card') {
        submitBtn.innerHTML = '<i class="fas fa-shield-alt fa-spin"></i> 3D Secure / Verified by Visa...';
        await new Promise(resolve => setTimeout(resolve, 800));
        submitBtn.innerHTML = '<i class="fas fa-check-circle"></i> Pagesa u autorizua me sukses!';
        await new Promise(resolve => setTimeout(resolve, 400));
      }

      const rawCardNum = (cardNumberInput ? cardNumberInput.value : '').replace(/\D/g, '');
      const cardMasked = rawCardNum.length >= 4 ? `•••• •••• •••• ${rawCardNum.slice(-4)}` : 'Kartelë Bankare';

      const orderRecord = {
        planId: currentSelectedPlan.id,
        planTitle: currentSelectedPlan.title,
        price: currentSelectedPlan.price,
        period: currentSelectedPlan.period,
        companyName: companyName,
        nui: formData.get('nui') || '',
        email: email,
        phone: phone,
        paymentMethod: paymentMethod,
        cardLast4: rawCardNum.slice(-4),
        status: paymentMethod === 'card' ? 'Paguar & Aktiv' : 'Në Procesim',
        activatedAt: new Date().toLocaleDateString('sq-AL'),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('sq-AL'),
        orderId: 'WP-' + Math.floor(100000 + Math.random() * 900000),
        transactionId: 'TXN-' + Date.now().toString(36).toUpperCase()
      };

      try {
        localStorage.setItem('activeCompanyPlan', JSON.stringify(orderRecord));
        const orders = JSON.parse(localStorage.getItem('companyPlanOrders') || '[]');
        orders.unshift(orderRecord);
        localStorage.setItem('companyPlanOrders', JSON.stringify(orders));
      } catch (_e) {}

      if (modalBody && modalFooter) {
        modalFooter.style.display = 'none';

        const paymentSuccessHtml = paymentMethod === 'card' ? `
          <div class="success-state">
            <div class="success-state-icon" style="background: var(--success-tint); color: var(--success);">
              <i class="fas fa-check-double"></i>
            </div>
            <h3 style="font-size: 1.45rem; font-weight: 800; margin-bottom: 6px; color: var(--text-main);">Pagesa u krye me sukses!</h3>
            <p style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 20px;">Transaksioni bankar prej <strong>${currentSelectedPlan.price}</strong> u autorizua. Paketa <strong>${currentSelectedPlan.title}</strong> është aktive menjëherë për kompaninë <strong>${companyName}</strong>.</p>
            
            <div style="background: var(--bg-body); border: 1px solid var(--border-color); border-radius: 14px; padding: 18px; margin-bottom: 24px; text-align: left; font-size: 0.88rem; color: var(--text-main);">
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px; border-bottom: 1px dashed var(--border-color); padding-bottom: 8px;">
                <span style="color: var(--text-muted);">ID Transaksionit:</span>
                <strong>${orderRecord.transactionId}</strong>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px; border-bottom: 1px dashed var(--border-color); padding-bottom: 8px;">
                <span style="color: var(--text-muted);">Paketa e blerë:</span>
                <strong>${currentSelectedPlan.title} (${currentSelectedPlan.price})</strong>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px; border-bottom: 1px dashed var(--border-color); padding-bottom: 8px;">
                <span style="color: var(--text-muted);">Karta e debituar:</span>
                <strong>${cardMasked}</strong>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px; border-bottom: 1px dashed var(--border-color); padding-bottom: 8px;">
                <span style="color: var(--text-muted);">Fatura me TVSH:</span>
                <span style="color: var(--primary); font-weight: 700;"><i class="fas fa-file-invoice"></i> Dërguar te ${email}</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: var(--text-muted);">Statusi i shërbimit:</span>
                <span style="color: var(--success); font-weight: 800;"><i class="fas fa-bolt"></i> Aktivizuar Menjëherë</span>
              </div>
            </div>

            <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
              <button id="finishOrderBtn" class="pricing-btn btn-tier-subscription" style="width: auto; padding: 12px 26px;">
                <i class="fas fa-th-large"></i> Shko te Paneli (Dashboard)
              </button>
              <button id="postJobOrderBtn" class="pricing-btn btn-tier-base" style="width: auto; padding: 12px 26px;">
                <i class="fas fa-plus"></i> Posto Shpalljen Tani
              </button>
            </div>
          </div>
        ` : `
          <div class="success-state">
            <div class="success-state-icon">
              <i class="fas fa-check"></i>
            </div>
            <h3 style="font-size: 1.45rem; font-weight: 800; margin-bottom: 6px; color: var(--text-main);">Kërkesa u regjistrua me sukses!</h3>
            <p style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 20px;">Faleminderit <strong>${companyName}</strong>. Fatura proformë për paketën <strong>${currentSelectedPlan.title}</strong> (${currentSelectedPlan.price}) u dërgua në email-in tuaj.</p>
            <div style="background: var(--bg-body); border: 1px solid var(--border-color); border-radius: 12px; padding: 16px; margin-bottom: 24px; text-align: left; font-size: 0.88rem; color: var(--text-main);">
              <div style="margin-bottom: 6px;"><strong>ID Porosisë:</strong> ${orderRecord.orderId}</div>
              <div style="margin-bottom: 6px;"><strong>Email:</strong> ${email}</div>
              <div style="margin-bottom: 6px;"><strong>Telefon:</strong> ${phone}</div>
              <div style="margin-bottom: 6px;"><strong>Metoda:</strong> ${paymentMethod.toUpperCase()}</div>
              <div><strong>Statusi:</strong> <span style="color: var(--primary); font-weight: 700;">Në Pritje të Pagesës Bankare</span></div>
            </div>
            <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
              <button id="finishOrderBtn" class="pricing-btn btn-tier-subscription" style="width: auto; padding: 12px 24px;">Shko te Paneli (Dashboard)</button>
              <button id="postJobOrderBtn" class="pricing-btn btn-tier-base" style="width: auto; padding: 12px 24px;">Posto Punë</button>
            </div>
          </div>
        `;

        modalBody.innerHTML = paymentSuccessHtml;

        const finishBtn = document.getElementById('finishOrderBtn');
        if (finishBtn) {
          finishBtn.addEventListener('click', () => {
            closeCheckoutModal();
            window.location.href = 'employer-dashboard.html';
          });
        }

        const postJobBtn = document.getElementById('postJobOrderBtn');
        if (postJobBtn) {
          postJobBtn.addEventListener('click', () => {
            closeCheckoutModal();
            window.location.href = 'employer-jobs.html';
          });
        }
      }
    });
  }

  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const questionBtn = item.querySelector('.faq-question');
    if (questionBtn) {
      questionBtn.addEventListener('click', () => {
        const isActive = item.classList.contains('active');
        faqItems.forEach(otherItem => otherItem.classList.remove('active'));
        if (!isActive) {
          item.classList.add('active');
        }
      });
    }
  });

  if (window.PlatformaAuth) {
    try {
      const user = await window.PlatformaAuth.me();
      if (user) {
        const companyInput = document.getElementById('companyNameInput');
        const emailInput = document.getElementById('emailInput');
        if (companyInput && user.companyName) companyInput.value = user.companyName;
        if (emailInput && user.email) emailInput.value = user.email;
      }
    } catch (_e) {}
  }
});
