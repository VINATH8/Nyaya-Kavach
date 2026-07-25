let selectedOption = 'case-id';
let trackInterval;

// Select tracking option (Case ID / Aadhar / Phone)
function selectTrackOption(option, el) {
    selectedOption = option;
    document.querySelectorAll('.track-option').forEach(e => e.classList.remove('active'));
    el.classList.add('active');

    const input = document.getElementById('trackInput');
    input.value = '';
    input.placeholder =
        option === 'case-id' ? 'Enter Case ID' :
        option === 'aadhar' ? 'Enter Aadhar Number' :
        'Enter Phone Number';
}

// Track complaint (called on search)
function trackComplaint() {
    const query = document.getElementById('trackInput').value.trim();
    if (!query) {
        alert('Please enter a value to track.');
        return;
    }

    // Clear previous interval
    if (trackInterval) clearInterval(trackInterval);

    // Initial fetch
    fetchCaseDetails(query);

    // Poll every 5 seconds for live timeline
    trackInterval = setInterval(() => fetchCaseDetails(query), 5000);
}

// Fetch case details from backend
function fetchCaseDetails(query) {
    fetch(`http://localhost:5000/api/complaints/track?${selectedOption}=${query}`)
        .then(res => res.json())
        .then(data => displayCaseDetails(data))
        .catch(err => console.error('Error fetching case details:', err));
}

// Display case info and timeline
function displayCaseDetails(data) {
    const caseDetails = document.getElementById('caseDetails');
    const caseInfoGrid = document.getElementById('caseInfoGrid');
    const caseTimeline = document.getElementById('caseTimeline');

    caseInfoGrid.innerHTML = '';
    caseTimeline.innerHTML = '';

    if (!data || Object.keys(data).length === 0) {
        caseInfoGrid.innerHTML = '<p>No case found.</p>';
        caseDetails.classList.remove('show');
        return;
    }

    caseDetails.classList.add('show');

    // Case information fields
    const fields = [
        { label: 'Case ID', value: data.caseId },
        { label: 'Complaint Type', value: data.complaintType },
        { label: 'Priority', value: data.priority },
        { label: 'Status', value: data.status },
        { label: 'Incident Date', value: data.incidentDate },
        { label: 'Location', value: data.location },
        { label: 'Description', value: data.description }
    ];

    fields.forEach(f => {
        const div = document.createElement('div');
        div.classList.add('case-info-item');
        div.innerHTML = `<div class="case-info-label">${f.label}</div>
                         <div class="case-info-value">${f.value || 'N/A'}</div>`;
        caseInfoGrid.appendChild(div);
    });

    // Timeline
    if (data.timeline && data.timeline.length > 0) {
        data.timeline.forEach((event, idx) => {
            const div = document.createElement('div');
            div.classList.add('timeline-item');
            if (idx === data.timeline.length - 1) div.classList.add('active');
            div.innerHTML = `<div class="timeline-date">${event.date}</div>
                             <div class="timeline-title">${event.title}</div>
                             <div class="timeline-description">${event.description}</div>`;
            caseTimeline.appendChild(div);
        });
    } else {
        caseTimeline.innerHTML = '<p>No timeline events available.</p>';
    }
}
