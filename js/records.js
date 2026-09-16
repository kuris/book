// book/js/records.js

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://ybhiznlelnpwaicyoifa.supabase.co'; // Replace with your Supabase URL
const SUPABASE_ANON_KEY = 'sb_publishable_H4gFRiLEjE8h8s_EX4tKzg__ZKpsBR1'; // Replace with your Supabase Anon Key

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { db: { schema: 'book' } });

document.addEventListener('DOMContentLoaded', async () => {
    const authRequired = document.getElementById('auth-required');
    const recordsContent = document.getElementById('records-content');
    const recordListGrid = document.querySelector('.record-list-grid');
    const noRecordsMessage = document.getElementById('no-records');

    const statusFilter = document.getElementById('status-filter');
    const visibilityFilter = document.getElementById('visibility-filter');
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const sortBy = document.getElementById('sort-by');

    let currentUser = null;

    CGAuth.onChange(async ({ user, isLoggedIn }) => {
        if (isLoggedIn) {
            currentUser = user;
            authRequired.style.display = 'none';
            recordsContent.style.display = 'block';
            loadRecords();
        } else {
            currentUser = null;
            authRequired.style.display = 'block';
            recordsContent.style.display = 'none';
            recordListGrid.innerHTML = ''; // Clear records if logged out
        }
    });

    // Initial check in case CGAuth is already resolved
    CGAuth.ready().then(async () => {
        if (CGAuth.isLoggedIn()) {
            currentUser = CGAuth.getUser();
            authRequired.style.display = 'none';
            recordsContent.style.display = 'block';
            loadRecords();
        } else {
            currentUser = null;
            authRequired.style.display = 'block';
            recordsContent.style.display = 'none';
            recordListGrid.innerHTML = '';
        }
    });

    statusFilter.addEventListener('change', loadRecords);
    visibilityFilter.addEventListener('change', loadRecords);
    searchButton.addEventListener('click', loadRecords);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') loadRecords();
    });
    sortBy.addEventListener('change', loadRecords);

    async function loadRecords() {
        recordListGrid.innerHTML = '<p>기록을 불러오는 중...</p>';
        noRecordsMessage.style.display = 'none';

        if (!currentUser) {
            recordListGrid.innerHTML = '';
            return; // Should be handled by authRequired display
        }

        const selectedStatus = statusFilter.value;
        const selectedVisibility = visibilityFilter.value;
        const searchTerm = searchInput.value.trim();
        const selectedSort = sortBy.value;

        let query = supabase.from('records').select('*');

        // Apply RLS for current user (handled by Supabase policies, but good for client-side filtering too)
        // For public records, any authenticated user can see them.
        // For private records, only the owner can see them.
        // The RLS policies in SQL will enforce this strictly.
        if (selectedVisibility === 'private') {
            query = query.eq('user_id', currentUser.id);
        } else if (selectedVisibility === 'public') {
            query = query.eq('visibility', 'public');
        }
        // If 'all', RLS will naturally filter private records to only the owner.

        if (selectedStatus !== 'all') {
            query = query.eq('reading_status', selectedStatus);
        }

        if (searchTerm) {
            query = query.or(
                `title.ilike.%${searchTerm}%`,
                `author.ilike.%${searchTerm}%`,
                `one_line_review.ilike.%${searchTerm}%`
            );
        }

        // Exclude soft-deleted records
        query = query.is('deleted_at', null);

        // Apply sorting
        const [sortColumn, sortOrder] = selectedSort.split('_');
        query = query.order(sortColumn, { ascending: sortOrder === 'asc' });

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching records:', error);
            recordListGrid.innerHTML = '<p>기록을 불러오는 데 실패했습니다.</p>';
            return;
        }

        if (data.length === 0) {
            noRecordsMessage.style.display = 'block';
            recordListGrid.innerHTML = '';
            return;
        }

        recordListGrid.innerHTML = data.map(record => `
            <div class="record-card">
                <h3><a href="view.html?id=${record.id}">${escapeHTML(record.title)}</a></h3>
                <p class="author">${escapeHTML(record.author || '' )}</p>
                <p class="one-line-review">${escapeHTML(record.one_line_review || '')}</p>
                <p class="date">${record.reading_date || new Date(record.created_at).toLocaleDateString()}</p>
                <p class="status">${BookData.statuses.find(s => s.value === record.reading_status)?.label || ''}</p>
                <p class="visibility">${record.visibility === 'public' ? '공개' : '비공개'}</p>
            </div>
        `).join('');
    }

    function escapeHTML(str) {
        const div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }
});
