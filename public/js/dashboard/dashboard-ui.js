export function showAnnouncementModal(message) {
  if (!document.getElementById('announcementModal')) {
    const modalHTML = `
      <div class="modal fade" id="announcementModal" tabindex="-1" aria-labelledby="announcementModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="announcementModalLabel"> Announcement</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <p id="announcementMessage">${message}</p>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  } else {
    document.getElementById('announcementMessage').innerHTML = message;
  }

  const modalElement = document.getElementById('announcementModal');
  const modal = new bootstrap.Modal(modalElement);
  modal.show();
}
