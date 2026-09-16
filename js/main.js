// book/js/main.js

document.addEventListener('DOMContentLoaded', () => {
    // Logic for loading recent public records on index.html
    const publicRecordsContainer = document.querySelector('#public-records .record-list');
    if (publicRecordsContainer) {
        // This will be replaced with actual Supabase fetching later
        publicRecordsContainer.innerHTML = '
            <div class="record-card">
                <h3>책 제목 예시 1</h3>
                <p class="author">저자명</p>
                <p class="one-line-review">"정말 감동적인 이야기였습니다!"</p>
                <p class="date">2026-09-14</p>
            </div>
            <div class="record-card">
                <h3>책 제목 예시 2</h3>
                <p class="author">다른 저자</p>
                <p class="one-line-review">"생각할 거리를 많이 던져주는 책."</p>
                <p class="date">2026-09-13</p>
            </div>
        ';
    }
});
