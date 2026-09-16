// book/js/view.js

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://ybhiznlelnpwaicyoifa.supabase.co'; // Replace with your Supabase URL
const SUPABASE_ANON_KEY = 'sb_publishable_H4gFRiLEjE8h8s_EX4tKzg__ZKpsBR1'; // Replace with your Supabase Anon Key

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { db: { schema: 'book' } });

document.addEventListener('DOMContentLoaded', async () => {
    const authRequired = document.getElementById('auth-required');
    const recordDetail = document.getElementById('record-detail');
    const editBtn = document.getElementById('edit-btn');
    const deleteBtn = document.getElementById('delete-btn');

    const params = new URLSearchParams(window.location.search);
    const recordId = params.get('id');

    let currentUser = null;

    if (!recordId) {
        alert('잘못된 접근입니다. 기록 ID가 필요합니다.');
        window.location.href = 'records.html';
        return;
    }

    const loadRecord = async (user_id = null) => {
        // Fetch record with RLS in mind.
        // If user is logged in, Supabase RLS will handle visibility correctly.
        // If user is anon, only public records will be returned.
        const { data, error } = await supabase.from('records').select('*').eq('id', recordId).single();

        if (error) {
            console.error('Error fetching record:', error);
            if (error.code === 'PGRST116') { // No rows found
                 alert('기록을 찾을 수 없거나 접근 권한이 없습니다.');
            } else {
                alert('기록을 불러오는 데 실패했습니다.');
            }
            window.location.href = 'records.html';
            return;
        }

        if (data.deleted_at) {
            alert('이 기록은 삭제되었습니다.');
            window.location.href = 'records.html';
            return;
        }

        document.getElementById('detail-title').textContent = escapeHTML(data.title);
        document.getElementById('detail-author').textContent = `저자: ${escapeHTML(data.author || '미상')}`;
        document.getElementById('detail-publisher').textContent = `출판사: ${escapeHTML(data.publisher || '미상')}`;
        document.getElementById('detail-category').textContent = `카테고리: ${escapeHTML(data.category || '기타')}`;
        document.getElementById('detail-status').textContent = `상태: ${BookData.statuses.find(s => s.value === data.reading_status)?.label || ''}`;
        document.getElementById('detail-rating').textContent = `별점: ${data.rating ? '⭐'.repeat(data.rating) : '없음'}`;
        document.getElementById('detail-reading-date').textContent = `읽은 날짜: ${data.reading_date || '미기록'}`;
        document.getElementById('detail-visibility').textContent = `공개 여부: ${data.visibility === 'public' ? '공개' : '비공개'}`;

        document.getElementById('detail-one-line-review').textContent = escapeHTML(data.one_line_review || '');

        document.getElementById('detail-summary').textContent = escapeHTML(data.summary || '내용 없음');
        document.getElementById('detail-memorable-sentence').textContent = escapeHTML(data.memorable_sentence || '내용 없음');
        document.getElementById('detail-feeling').textContent = escapeHTML(data.feeling || '내용 없음');
        document.getElementById('detail-learned').textContent = escapeHTML(data.learned || '내용 없음');
        document.getElementById('detail-action-plan').textContent = escapeHTML(data.action_plan || '내용 없음');
        document.getElementById('detail-favorite-character').textContent = escapeHTML(data.favorite_character || '내용 없음');
        document.getElementById('detail-question-after-reading').textContent = escapeHTML(data.question_after_reading || '내용 없음');

        // Hide empty sections
        const sections = [
            { id: 'section-summary', data: data.summary },
            { id: 'section-memorable-sentence', data: data.memorable_sentence },
            { id: 'section-feeling', data: data.feeling },
            { id: 'section-learned', data: data.learned },
            { id: 'section-action-plan', data: data.action_plan },
            { id: 'section-favorite-character', data: data.favorite_character },
            { id: 'section-question', data: data.question_after_reading },
        ];
        sections.forEach(s => {
            document.getElementById(s.id).style.display = s.data ? 'block' : 'none';
        });

        // Show/hide edit/delete buttons if current user is the owner
        if (currentUser && data.user_id === currentUser.id) {
            editBtn.style.display = 'inline-block';
            deleteBtn.style.display = 'inline-block';
            editBtn.onclick = () => { window.location.href = `write.html?id=${recordId}`; };
            deleteBtn.onclick = () => deleteRecord(recordId);
        } else {
            editBtn.style.display = 'none';
            deleteBtn.style.display = 'none';
        }

        recordDetail.style.display = 'block';
        authRequired.style.display = 'none'; // Hide auth prompt if record is loaded
    };

    const deleteRecord = async (id) => {
        if (!confirm('정말로 이 기록을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
            return;
        }

        const { error } = await supabase.from('records').update({ deleted_at: new Date().toISOString() }).eq('id', id).eq('user_id', currentUser.id);

        if (error) {
            console.error('Error soft-deleting record:', error);
            alert('기록 삭제에 실패했습니다: ' + error.message);
        } else {
            alert('기록이 성공적으로 삭제되었습니다.');
            window.location.href = 'records.html';
        }
    };

    CGAuth.onChange(async ({ user, isLoggedIn }) => {
        if (isLoggedIn) {
            currentUser = user;
            authRequired.style.display = 'none';
            loadRecord(currentUser.id);
        } else {
            currentUser = null;
            // If not logged in, attempt to load public record. If private, RLS will deny.
            loadRecord(null);
            // If still no record, then show auth required (handled by loadRecord error flow)
            recordDetail.style.display = 'none';
            authRequired.style.display = 'block';
        }
    });

    // Initial check and load
    CGAuth.ready().then(async () => {
        if (CGAuth.isLoggedIn()) {
            currentUser = CGAuth.getUser();
            await loadRecord(currentUser.id);
        } else {
            // Attempt to load as anonymous user (will only get public records)
            await loadRecord(null);
            if (recordDetail.style.display === 'none') { // If no public record was loaded
                authRequired.style.display = 'block';
            }
        }
    });

    function escapeHTML(str) {
        const div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }
});
