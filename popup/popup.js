// DOM Elements
const announcementsList = document.getElementById('announcements-list');
const coursesList = document.getElementById('courses-list');
const assignmentsList = document.getElementById('assignments-list');
const settingsBtn = document.getElementById('open-settings');

// Add settings button listener
settingsBtn?.addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

// Expansion logic for sections
document.querySelectorAll('.section-header').forEach(header => {
  header.addEventListener('click', () => {
    const parent = header.parentElement;
    const content = parent.querySelector('.section-content');
    const expandBtn = header.querySelector('.expand-button');

    const isExpanding = !content.classList.contains('active');

    // Close other sections
    document.querySelectorAll('.section-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.expand-button').forEach(b => b.style.transform = 'rotate(0deg)');

    if (isExpanding) {
      content.classList.add('active');
      expandBtn.style.transform = 'rotate(180deg)';
    }
  });
});

// Fetch data when popup opens
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const result = await chrome.storage.local.get(['plannable', 'classes']);

    // In our implementation, announcements are inside plannable
    const plannable = result.plannable || [];
    const announcements = plannable.filter(i => i.plannable_type === 'announcement');
    const plannableItems = plannable.filter(i => i.plannable_type === 'assignment' || i.plannable_type === 'quiz');

    renderAnnouncements(announcements);
    renderCourses(result.classes || []);
    renderAssignments(plannableItems);

    // Initial expansion: Priority Assignments
    const assignmentsSection = document.getElementById('assignments');
    if (assignmentsSection) {
      assignmentsSection.querySelector('.section-content').classList.add('active');
      assignmentsSection.querySelector('.expand-button').style.transform = 'rotate(180deg)';
    }
  } catch (error) {
    console.error('Error loading popup data:', error);
  }
});

function renderAnnouncements(announcements) {
  announcementsList.innerHTML = announcements.length > 0
    ? announcements.slice(0, 5).map(a => `
        <li>
          <div>
            <div style="font-weight: 500;">${a.plannable.title}</div>
            <div style="font-size: 11px; color: #666;">${a.context_name || ''}</div>
          </div>
        </li>
      `).join('')
    : '<li>No recent announcements</li>';
}

function renderCourses(courses) {
  coursesList.innerHTML = courses.length > 0
    ? courses.map(c => `
        <li>
          <span>${c.name || c.course_code}</span>
          <span class="course-pill">${c.course_code}</span>
        </li>
      `).join('')
    : '<li>No courses found</li>';
}

function renderAssignments(items) {
  const now = new Date();
  const assignments = items
    .filter(i => i.plannable.due_at)
    .sort((a, b) => new Date(a.plannable.due_at) - new Date(b.plannable.due_at))
    .slice(0, 10);

  assignmentsList.innerHTML = assignments.length > 0
    ? assignments.map(a => {
      const dueDate = new Date(a.plannable.due_at);
      const hoursLeft = (dueDate - now) / (1000 * 60 * 60);
      const isUrgent = hoursLeft > 0 && hoursLeft < 48;

      return `
          <li>
            <div style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-right: 8px;" title="${a.plannable.title}">
              ${a.plannable.title}
            </div>
            <div class="${isUrgent ? 'due-soon' : ''}" style="font-size: 12px; min-width: 60px; text-align: right;">
              ${dueDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </div>
          </li>
        `;
    }).join('')
    : '<li>No upcoming assignments</li>';
}
