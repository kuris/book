// book/js/write.js

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://ybhiznlelnpwaicyoifa.supabase.co'; // Replace with your Supabase URL
const SUPABASE_ANON_KEY = 'sb_publishable_H4gFRiLEjE8h8s_EX4tKzg__ZKpsBR1'; // Replace with your Supabase Anon Key

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { db: { schema: 'book' } });

document.addEventListener('DOMContentLoaded', async () => {
    const authRequired = document.getElementById('auth-required');
    const writeContent = document.getElementById('write-content');
    const recordForm = document.getElementById('record-form');
    const recordIdField = document.getElementById('record-id');
    const pageTitle = document.getElementById('page-title');

    // Input fields
    const titleInput = document.getElementById('title');
    const authorInput = document.getElementById('author');
    const publisherInput = document.getElementById('publisher');
    const isbnInput = document.getElementById('isbn');
    const categorySelect = document.getElementById('category');
    const statusSelect = document.getElementById('reading-status');
    const startedAtInput = document.getElementById('started-at');
    const finishedAtInput = document.getElementById('finished-at');
    const readingDateInput = document.getElementById('reading-date');
    const oneLineReviewInput = document.getElementById('one-line-review');
    const summaryTextarea = document.getElementById('summary');
    const memorableSentenceTextarea = document.getElementById('memorable-sentence');
    const feelingTextarea = document.getElementById('feeling');
    const learnedTextarea = document.getElementById('learned');
    const actionPlanTextarea = document.getElementById('action-plan');
    const favoriteCharacterInput = document.getElementById('favorite-character');
    const questionAfterReadingTextarea = document.getElementById('question-after-reading');
    const visibilitySelect = document.getElementById('visibility');
    const ratingRadios = document.querySelectorAll('input[name="rating"]');
    const cancelBtn = document.getElementById('cancel-btn');
    const tempSaveBtn = document.getElementById('temp-save-btn');

    let currentUser = null;
    const recordId = new URLSearchParams(window.location.search).get('id');

    // Populate categories and statuses
    if (window.BookData) {
        BookData.categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            categorySelect.appendChild(option);
        });

        BookData.statuses.forEach(status => {
            const option = document.createElement('option');
            option.value = status.value;
            option.textContent = status.label;
            statusSelect.appendChild(option);
        });
    }

    // Populate prompts
    if (window.BookPrompts) {
        const promptFields = [
            { id: 'summary-prompts', prompts: BookPrompts.summary },
            { id: 'memorable-sentence-prompts', prompts: BookPrompts.memorable_sentence },
            { id: 'feeling-prompts', prompts: BookPrompts.feeling },
            { id: 'learned-prompts', prompts: BookPrompts.learned },
            { id: 'action-plan-prompts', prompts: BookPrompts.action_plan },
            { id: 'favorite-character-prompts', prompts: BookPrompts.favorite_character },
            { id: 'question-prompts', prompts: BookPrompts.question_after_reading },
        ];

        promptFields.forEach(field => {
            const ul = document.getElementById(field.id);
            if (ul && field.prompts) {
                field.prompts.forEach(p => {
                    const li = document.createElement('li');
                    li.textContent = p;
                    li.addEventListener('click', () => {
                        const targetTextarea = ul.previousElementSibling; // Assuming textarea is right before ul
                        if (targetTextarea && targetTextarea.tagName === 'TEXTAREA') {
                            targetTextarea.value += (targetTextarea.value ? '

' : '') + p;
                        }
                    });
                    ul.appendChild(li);
                });
            }
        });
    }

    CGAuth.onChange(async ({ user, isLoggedIn }) => {
        if (isLoggedIn) {
            currentUser = user;
            authRequired.style.display = 'none';
            writeContent.style.display = 'block';
            if (recordId) {
                pageTitle.textContent = '독서기록 수정';
                loadRecordForEdit(recordId);
            }
        } else {
            currentUser = null;
            authRequired.style.display = 'block';
            writeContent.style.display = 'none';
        }
    });

    // Initial check in case CGAuth is already resolved
    CGAuth.ready().then(async () => {
        if (CGAuth.isLoggedIn()) {
            currentUser = CGAuth.getUser();
            authRequired.style.display = 'none';
            writeContent.style.display = 'block';
            if (recordId) {
                pageTitle.textContent = '독서기록 수정';
                loadRecordForEdit(recordId);
            }
        } else {
            currentUser = null;
            authRequired.style.display = 'block';
            writeContent.style.display = 'none';
        }
    });

    async function loadRecordForEdit(id) {
        const { data, error } = await supabase.from('records').select('*').eq('id', id).single();
        if (error || !data) {
            console.error('Error loading record for edit:', error);
            alert('기록을 불러오는 데 실패했습니다.');
            window.location.href = 'records.html';
            return;
        }

        if (data.user_id !== currentUser.id) {
            alert('이 기록을 수정할 권한이 없습니다.');
            window.location.href = 'records.html';
            return;
        }

        recordIdField.value = data.id;
        titleInput.value = data.title;
        authorInput.value = data.author;
        publisherInput.value = data.publisher;
        isbnInput.value = data.isbn;
        categorySelect.value = data.category;
        statusSelect.value = data.reading_status;
        startedAtInput.value = data.started_at;
        finishedAtInput.value = data.finished_at;
        readingDateInput.value = data.reading_date;
        oneLineReviewInput.value = data.one_line_review;
        summaryTextarea.value = data.summary;
        memorableSentenceTextarea.value = data.memorable_sentence;
        feelingTextarea.value = data.feeling;
        learnedTextarea.value = data.learned;
        actionPlanTextarea.value = data.action_plan;
        favoriteCharacterInput.value = data.favorite_character;
        questionAfterReadingTextarea.value = data.question_after_reading;
        visibilitySelect.value = data.visibility;

        if (data.rating) {
            document.getElementById(`rating-${data.rating}`).checked = true;
        } else {
            document.getElementById(`rating-0`).checked = true;
        }
    }

    recordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentUser) {
            alert('로그인 후 이용해주세요.');
            return;
        }

        // Basic validation
        if (!titleInput.value.trim()) {
            alert('책 제목은 필수입니다.');
            return;
        }

        const selectedRating = document.querySelector('input[name="rating"]:checked').value;

        const recordData = {
            user_id: currentUser.id,
            title: titleInput.value.trim(),
            author: authorInput.value.trim() || null,
            publisher: publisherInput.value.trim() || null,
            isbn: isbnInput.value.trim() || null,
            category: categorySelect.value || null,
            reading_status: statusSelect.value,
            started_at: startedAtInput.value || null,
            finished_at: finishedAtInput.value || null,
            reading_date: readingDateInput.value || null,
            rating: selectedRating ? parseInt(selectedRating, 10) : null,
            one_line_review: oneLineReviewInput.value.trim() || null,
            summary: summaryTextarea.value.trim() || null,
            memorable_sentence: memorableSentenceTextarea.value.trim() || null,
            feeling: feelingTextarea.value.trim() || null,
            learned: learnedTextarea.value.trim() || null,
            action_plan: actionPlanTextarea.value.trim() || null,
            favorite_character: favoriteCharacterInput.value.trim() || null,
            question_after_reading: questionAfterReadingTextarea.value.trim() || null,
            visibility: visibilitySelect.value,
        };

        let result;
        if (recordId) {
            // Update existing record
            result = await supabase.from('records').update(recordData).eq('id', recordId).eq('user_id', currentUser.id);
        } else {
            // Insert new record
            result = await supabase.from('records').insert([recordData]);
        }

        if (result.error) {
            console.error('Error saving record:', result.error);
            alert('기록 저장에 실패했습니다: ' + result.error.message);
        } else {
            alert('기록이 성공적으로 저장되었습니다!');
            // Redirect to view or records page
            window.location.href = recordId ? `view.html?id=${recordId}` : 'records.html';
        }
    });

    tempSaveBtn.addEventListener('click', () => {
        const currentRecord = {
            title: titleInput.value,
            author: authorInput.value,
            publisher: publisherInput.value,
            isbn: isbnInput.value,
            category: categorySelect.value,
            reading_status: statusSelect.value,
            started_at: startedAtInput.value,
            finished_at: finishedAtInput.value,
            reading_date: readingDateInput.value,
            rating: document.querySelector('input[name="rating"]:checked').value,
            one_line_review: oneLineReviewInput.value,
            summary: summaryTextarea.value,
            memorable_sentence: memorableSentenceTextarea.value,
            feeling: feelingTextarea.value,
            learned: learnedTextarea.value,
            action_plan: actionPlanTextarea.value,
            favorite_character: favoriteCharacterInput.value,
            question_after_reading: questionAfterReadingTextarea.value,
            visibility: visibilitySelect.value,
            // Do not store user_id or id for temporary local storage
        };
        localStorage.setItem('book_temp_record', JSON.stringify(currentRecord));
        alert('현재 내용이 임시 저장되었습니다.');
    });

    cancelBtn.addEventListener('click', () => {
        if (confirm('작성을 취소하고 목록으로 돌아가시겠습니까? 저장되지 않은 내용은 사라집니다.')) {
            localStorage.removeItem('book_temp_record'); // Clear temporary save on cancel
            window.location.href = 'records.html';
        }
    });

    // Load temporary saved data if any, only for new records
    if (!recordId) {
        const tempRecord = localStorage.getItem('book_temp_record');
        if (tempRecord) {
            if (confirm('임시 저장된 내용이 있습니다. 이어서 작성하시겠습니까?')) {
                const data = JSON.parse(tempRecord);
                titleInput.value = data.title || '';
                authorInput.value = data.author || '';
                publisherInput.value = data.publisher || '';
                isbnInput.value = data.isbn || '';
                categorySelect.value = data.category || '';
                statusSelect.value = data.reading_status || 'done';
                startedAtInput.value = data.started_at || '';
                finishedAtInput.value = data.finished_at || '';
                readingDateInput.value = data.reading_date || '';
                oneLineReviewInput.value = data.one_line_review || '';
                summaryTextarea.value = data.summary || '';
                memorableSentenceTextarea.value = data.memorable_sentence || '';
                feelingTextarea.value = data.feeling || '';
                learnedTextarea.value = data.learned || '';
                actionPlanTextarea.value = data.action_plan || '';
                favoriteCharacterInput.value = data.favorite_character || '';
                questionAfterReadingTextarea.value = data.question_after_reading || '';
                visibilitySelect.value = data.visibility || 'private';
                if (data.rating) {
                    document.getElementById(`rating-${data.rating}`).checked = true;
                } else {
                    document.getElementById(`rating-0`).checked = true;
                }
            }
            // Clear temp storage after loading or declining
            localStorage.removeItem('book_temp_record');
        }
    }
});
