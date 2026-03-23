// script.js - fixed for complaint.html

document.addEventListener('DOMContentLoaded', () => {

  // ---------- Elements ----------
  const verifyBtn = document.getElementById('verifyBtn');
  const aadharInput = document.getElementById('aadharNumber');
  const verificationStatus = document.getElementById('verificationStatus');
  const formContainer = document.getElementById('complaintFormContainer');
  const complaintForm = document.getElementById('complaintForm');
  const fileInput = document.getElementById('evidence');
  const fileList = document.getElementById('fileList');
  const dropArea = document.getElementById('dropArea');
  const submitBtn = document.getElementById('submitBtn');
  const descField = document.getElementById('description');
  const micBtn = document.getElementById("micButton");
  const prioritySelect = document.getElementById('priority');

  // inline severity suggestion element
  let severitySuggestion = document.getElementById('severitySuggestion');
  if (!severitySuggestion && prioritySelect) {
    severitySuggestion = document.createElement('div');
    severitySuggestion.id = 'severitySuggestion';
    severitySuggestion.style.marginTop = '6px';
    severitySuggestion.style.fontSize = '0.95rem';
    severitySuggestion.style.color = '#333';
    prioritySelect.parentNode.appendChild(severitySuggestion);
  }

  // ---------- UI helpers ----------
  function setVerifiedUI(isVerified) {
    if (isVerified) {
      verificationStatus.innerHTML = '<span style="color:#4CAF50;">✅ Verified</span>';
      formContainer.style.opacity = '1';
      formContainer.style.pointerEvents = 'auto';
    } else {
      verificationStatus.innerHTML = '<span style="color:#f44336;">❌ Invalid Aadhar</span>';
      formContainer.style.opacity = '0.5';
      formContainer.style.pointerEvents = 'none';
    }
  }

  function showSeveritySuggestion(msg) {
    if (!severitySuggestion) return;
    severitySuggestion.textContent = msg;
    severitySuggestion.style.display = 'block';
    clearTimeout(severitySuggestion._hideTimer);
    severitySuggestion._hideTimer = setTimeout(() => {
      severitySuggestion.style.display = 'none';
    }, 7000);
  }

  // ---------- Aadhaar verify ----------
  verifyBtn && verifyBtn.addEventListener('click', () => {
    const a = (aadharInput && aadharInput.value || '').trim();
    if (/^\d{12}$/.test(a)) {
      setVerifiedUI(true);
    } else {
      setVerifiedUI(false);
      alert('Please enter a valid 12-digit Aadhaar number.');
    }
  });

  // ---------- File drag/drop ----------
  function updateFileList(files) {
    if (!fileList) return;
    fileList.innerHTML = '';
    Array.from(files).forEach(file => {
      const div = document.createElement('div');
      div.textContent = `${file.name} (${Math.round(file.size/1024)} KB)`;
      fileList.appendChild(div);
    });
  }

  dropArea && dropArea.addEventListener('click', () => fileInput && fileInput.click());

  if (dropArea) {
    ['dragenter','dragover'].forEach(ev => {
      dropArea.addEventListener(ev, (e) => {
        e.preventDefault(); e.stopPropagation();
        dropArea.classList.add('dragover');
      });
    });
    ['dragleave','drop'].forEach(ev => {
      dropArea.addEventListener(ev, (e) => {
        e.preventDefault(); e.stopPropagation();
        dropArea.classList.remove('dragover');
      });
    });
    dropArea.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      if (dt && dt.files && dt.files.length) {
        fileInput.files = dt.files;
        updateFileList(dt.files);
      }
    });
  }

  fileInput && fileInput.addEventListener('change', () => updateFileList(fileInput.files));

  // ---------- Form submit ----------
  complaintForm && complaintForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const payload = {
      aadharNumber: (document.getElementById('aadharNumber')||{}).value?.trim() || '',
      complaintType: (document.getElementById('complaintType')||{}).value || '',
      priority: (document.getElementById('priority')||{}).value || '',
      incidentDate: (document.getElementById('incidentDate')||{}).value || '',
      location: (document.getElementById('location')||{}).value?.trim() || '',
      description: (document.getElementById('description')||{}).value?.trim() || '',
      fullName: (document.getElementById('fullName')||{}).value?.trim() || '',
      phone: (document.getElementById('phone')||{}).value?.trim() || '',
      email: (document.getElementById('email')||{}).value?.trim() || '',
      address: (document.getElementById('address')||{}).value?.trim() || '',
      witnesses: (document.getElementById('witnesses')||{}).value?.trim() || '',
      anonymous: !!(document.getElementById('anonymous')||{}).checked,
      smsUpdates: !!(document.getElementById('smsUpdates')||{}).checked,
      emailUpdates: !!(document.getElementById('emailUpdates')||{}).checked,
      evidenceFiles: Array.from((fileInput && fileInput.files) || []).map(f => f.name)
    };

    if (!/^\d{12}$/.test(payload.aadharNumber)) {
      alert('⚠️ Please enter a valid 12-digit Aadhaar number.');
      aadharInput && aadharInput.focus();
      return;
    }

    if (payload.phone && !/^\d{10}$/.test(payload.phone)) {
      alert('⚠️ Please enter a valid 10-digit phone number.');
      document.getElementById('phone') && document.getElementById('phone').focus();
      return;
    }

    if (!payload.fullName || !payload.complaintType || !payload.location || !payload.description) {
      alert('⚠️ Please fill the required fields: name, complaint type, location and description.');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    try {
      const res = await fetch('http://localhost:5000/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json().catch(()=>({}));

      if (res.ok) {
        alert(`✅ Complaint submitted successfully!\n\n📌 Your Case ID: ${data.caseId || 'N/A'}\n\nUse this ID to track your case.`);
        complaintForm.reset();
        updateFileList([]);
        formContainer.style.opacity = '0.5';
        formContainer.style.pointerEvents = 'none';
        verificationStatus.innerHTML = '<span style="color: #FFC107;">⏳ Verification Pending</span>';
      } else {
        alert('❌ Error submitting complaint: ' + (data.message || data.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Submit error:', err);
      alert('❌ Failed to connect to server. Ensure backend is running and accessible at http://localhost:5000');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = '🚀 Submit Complaint';
    }
  });

  // ---------- VOICE (for description) ----------
  let recognition;
  let isListening = false;

  if ("webkitSpeechRecognition" in window && micBtn) {
    recognition = new webkitSpeechRecognition();
    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      isListening = true;
      micBtn.textContent = "🎤 Listening... (click to stop)";
      micBtn.style.backgroundColor = "red";
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      descField.value = (descField.value + " " + transcript).trim();
      estimateAndSetSeverity(descField.value);
    };

    recognition.onerror = () => stopListening();
    recognition.onend = () => {
      isListening = false;
      micBtn.textContent = "🎤 Start Voice Input";
      micBtn.style.backgroundColor = "";
    };
  }

  function startListening() {
    if (recognition && !isListening) recognition.start();
  }

  function stopListening() {
    if (recognition && isListening) recognition.stop();
  }

  micBtn && micBtn.addEventListener("click", () => {
    if (!recognition) {
      alert("Speech recognition not supported in this browser.");
      return;
    }
    if (isListening) stopListening(); else startListening();
  });

  // ---------- Severity estimation ----------
  function estimateSeverity(text) {
    if (!text) return 'low';
    const t = text.toLowerCase();

    const urgent = /\b(murder|life[\s-]?threat|terror|kidnap|hostage|emergency|urgent|rape|sexual.?assault|kill|shoot|stab|bomb)\b/;
    const high = /\b(attack|assault|violence|harass|theft|robber(y|ies)?|robbed|beating|explosion)\b/;
    const medium = /\b(fraud|cheat|scam|cyber|stalk|extortion|blackmail|threat)\b/;

    if (urgent.test(t)) return 'urgent';
    if (high.test(t)) return 'high';
    if (medium.test(t)) return 'medium';
    return 'low';
  }

  function estimateAndSetSeverity(text) {
    const sev = estimateSeverity(text);
    if (prioritySelect) prioritySelect.value = sev;
    showSeveritySuggestion(`🤖 AI Suggestion: Complaint priority set to "${sev.toUpperCase()}"`);
  }

  // run when user leaves description
  descField && descField.addEventListener('blur', () => {
    if (descField.value.trim()) estimateAndSetSeverity(descField.value);
  });
});
