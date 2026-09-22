const $ = document;
const body = $.body;
const themeBtn = $.getElementById("theme-btn");
const newNoteBtn = $.getElementById("new-note");
const noteList = $.getElementById("note-list");
const emptyState = $.getElementById("empty-state");
const insertTableBtn = $.getElementById("insert-table-btn");
const addRowBtn = $.getElementById("add-row-btn");
const addColumnBtn = $.getElementById("add-column-btn");
const noteTitle = $.getElementById("note-title");
const fontSizeSelect = $.getElementById("font-size-select");
const noteContent = $.getElementById("note-content");
const editorWrapper = $.getElementById("editor-content-wrapper");
const colorBtn = $.getElementById("color-btn");
const colorPicker = $.getElementById("color-picker");
const hrBtn = $.getElementById("hr-btn");
const searchInput = $.getElementById("search-notes");
const saveNoteBtn = $.getElementById("save-note");
const boldBtn = $.getElementById("bold-btn");
const italicBtn = $.getElementById("italic-btn");
const underlineBtn = $.getElementById("underline-btn");
const insertUnorderedListBtn = $.getElementById("insert-unordered-list");
const insertOrderedListBtn = $.getElementById("insert-ordered-list");
const rtlLtrBtn = $.getElementById("rtl-ltr-btn");
const exportNotesBtn = $.getElementById("export-notes-btn");
const importNotesBtn = $.getElementById("import-notes-btn");
const importFileInput = $.getElementById("import-file-input");

// Modal Elements
const customModal = $.getElementById("custom-modal");
const modalMessage = $.getElementById("modal-message");
const modalIcon = $.querySelector(".modal-icon");
const modalCloseBtn = $.getElementById("modal-close-btn");
const modalConfirmBtn = $.getElementById("modal-confirm-btn");
const modalCancelBtn = $.getElementById("modal-cancel-btn");
const modalForm = $.getElementById("modal-form");
const modalLinkForm = $.getElementById("modal-link-form");
const linkUrlInput = $.getElementById("link-url-input");
const linkTextInput = $.getElementById("link-text-input");
const linkTextGroup = $.getElementById("link-text-group");
const tableRowsInput = $.getElementById("table-rows");
const tableColsInput = $.getElementById("table-cols");

const toggleSidebarBtn = $.getElementById("toggle-sidebar-btn");
const sidebar = $.getElementById("sidebar");
const insertLinkBtn = $.getElementById("insert-link-btn");

let notes = [];
let currentNoteIndex = -1;
let db;
let autoSaveTimeout;
let isSidebarHidden = false;
let savedRange = null; // برای ذخیره دقیق کلمه انتخاب شده برای ساخت لینک

// SVG Icons
const PIN_SVG = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="17" x2="12" y2="22"></line><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path></svg>`;
const TRASH_SVG = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>`;

// ——————————————————————————
// IndexedDB
// ——————————————————————————
const DB_NAME = "NotePadProDB";
const DB_VERSION = 1;
const STORE_NAME = "notes";

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };
        request.onupgradeneeded = (event) => {
            db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, {
                    keyPath: "id",
                    autoIncrement: true,
                });
                store.createIndex("title", "title", { unique: false });
                store.createIndex("lastEdited", "lastEdited", { unique: false });
                store.createIndex("pinned", "pinned", { unique: false });
            }
        };
    });
}

async function getAllNotes() {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    return new Promise((resolve) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
    });
}

async function addNote(note) {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    return new Promise((resolve) => {
        const request = store.add(note);
        request.onsuccess = () => resolve(request.result);
    });
}

async function updateNote(note) {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    return new Promise((resolve) => {
        const request = store.put(note);
        request.onsuccess = () => resolve();
    });
}

async function deleteNote(id) {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    return new Promise((resolve) => {
        store.delete(id);
        tx.oncomplete = resolve;
    });
}

// ——————————————————————————
// Sidebar Toggle
// ——————————————————————————
function updateSidebarState() {
    if (isSidebarHidden) {
        sidebar.classList.add("hidden");
    } else {
        sidebar.classList.remove("hidden");
    }
}

// ——————————————————————————
// Modal System
// ——————————————————————————
function showCustomModal(message, type = "success", onConfirm = null) {
    modalMessage.textContent = message;
    modalIcon.className = "modal-icon";
    
    modalCloseBtn.style.display = (type === "confirm" || type === "form" || type === "link") ? "none" : "block";
    modalConfirmBtn.style.display = (type === "confirm" || type === "form" || type === "link") ? "block" : "none";
    modalCancelBtn.style.display = (type === "confirm" || type === "form" || type === "link") ? "block" : "none";
    
    modalForm.style.display = type === "form" ? "flex" : "none";
    modalLinkForm.style.display = type === "link" ? "flex" : "none";

    if (type === "success") modalIcon.classList.add("success");
    else if (type === "error") modalIcon.classList.add("error");
    else if (type === "confirm" || type === "form" || type === "link") modalIcon.classList.add("question");

    customModal.style.display = "flex";
    requestAnimationFrame(() => {
        customModal.classList.add("show");
    });

    if (type === "success") {
        setTimeout(closeCustomModal, 2200);
    }

    if ((type === "confirm" || type === "form" || type === "link") && onConfirm) {
        modalConfirmBtn.onclick = () => {
            onConfirm();
            closeCustomModal();
        };
        modalCancelBtn.onclick = () => {
            closeCustomModal();
        };
    }
}

function closeCustomModal() {
    customModal.classList.remove("show");
    setTimeout(() => {
        customModal.style.display = "none";
        modalConfirmBtn.onclick = null;
        modalCancelBtn.onclick = null;
    }, 250);
}

modalCloseBtn.addEventListener("click", closeCustomModal);
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && customModal.classList.contains("show")) {
        closeCustomModal();
    }
});

// ——————————————————————————
// Notes Rendering & Transitions
// ——————————————————————————
function stripHtml(html) {
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
}

async function renderNotes(notesToRender = notes) {
    noteList.innerHTML = "";

    if (notesToRender.length === 0) {
        emptyState.style.display = "flex";
        return;
    } else {
        emptyState.style.display = "none";
    }

    const sortedNotes = [...notesToRender].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

    sortedNotes.forEach((note) => {
        const originalIndex = notes.indexOf(note);
        const li = document.createElement("li");
        if (originalIndex === currentNoteIndex) {
            li.classList.add("active");
        }

        const infoDiv = document.createElement("div");
        infoDiv.className = "note-card-info";

        const titleDiv = document.createElement("div");
        titleDiv.className = "note-card-title";
        titleDiv.textContent = note.title || "یادداشت بدون عنوان";

        const snippetDiv = document.createElement("div");
        snippetDiv.className = "note-card-snippet";
        const cleanContent = stripHtml(note.content || "");
        snippetDiv.textContent = cleanContent ? cleanContent.slice(0, 42) + "..." : "محتوای خالی";

        infoDiv.appendChild(titleDiv);
        infoDiv.appendChild(snippetDiv);

        const actionsDiv = document.createElement("div");
        actionsDiv.className = "note-card-actions";

        // SVG Pin Button
        const pinBtn = document.createElement("button");
        pinBtn.className = `pin-note ${note.pinned ? "is-pinned" : ""}`;
        pinBtn.title = note.pinned ? "برداشتن سنجاق" : "سنجاق کردن";
        pinBtn.innerHTML = PIN_SVG;
        pinBtn.addEventListener("click", async (e) => {
            e.stopPropagation();
            note.pinned = !note.pinned;
            await updateNote(note);
            renderNotes();
        });

        // SVG Delete Button
        const delBtn = document.createElement("button");
        delBtn.className = "delete-note";
        delBtn.title = "حذف یادداشت";
        delBtn.innerHTML = TRASH_SVG;
        delBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            showCustomModal("آیا از حذف این یادداشت اطمینان دارید؟", "confirm", async () => {
                await deleteNote(note.id);
                notes.splice(originalIndex, 1);
                if (currentNoteIndex === originalIndex) {
                    currentNoteIndex = -1;
                    loadNote();
                } else if (currentNoteIndex > originalIndex) {
                    currentNoteIndex--;
                }
                renderNotes();
            });
        });

        actionsDiv.appendChild(pinBtn);
        actionsDiv.appendChild(delBtn);

        li.appendChild(infoDiv);
        li.appendChild(actionsDiv);

        li.addEventListener("click", () => {
            if (currentNoteIndex === originalIndex) return;
            currentNoteIndex = originalIndex;
            loadNoteWithTransition();
            renderNotes();
        });

        noteList.appendChild(li);
    });
}

function loadNoteWithTransition() {
    editorWrapper.classList.add("note-transitioning");
    setTimeout(() => {
        loadNote();
        editorWrapper.classList.remove("note-transitioning");
    }, 180);
}

function loadNote() {
    if (currentNoteIndex !== -1 && notes[currentNoteIndex]) {
        const note = notes[currentNoteIndex];
        noteTitle.value = note.title || "";
        noteContent.innerHTML = note.content || "";
    } else {
        noteTitle.value = "";
        noteContent.innerHTML = "";
    }
}

async function saveNotes() {
    if (currentNoteIndex === -1) return;
    const note = notes[currentNoteIndex];
    note.title = noteTitle.value;
    note.content = noteContent.innerHTML;
    note.lastEdited = Date.now();
    await updateNote(note);
    renderNotes();
}

// ——————————————————————————
// Formatting Helpers
// ——————————————————————————
function insertHtmlAtCursor(html, targetRange = null) {
    if (document.activeElement !== noteContent) {
        noteContent.focus();
    }
    
    let range = targetRange;
    const selection = window.getSelection();

    if (!range) {
        if (selection.rangeCount > 0) {
            range = selection.getRangeAt(0);
        } else {
            range = document.createRange();
            range.selectNodeContents(noteContent);
            range.collapse(false);
        }
    }

    selection.removeAllRanges();
    selection.addRange(range);
    range.deleteContents();

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    const fragment = document.createDocumentFragment();
    let node;
    while ((node = tempDiv.firstChild)) {
        fragment.appendChild(node);
    }
    range.insertNode(fragment);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);

    handleInputUpdate();
}

// Custom Modal for Link
function openLinkModal() {
    const selection = window.getSelection();
    let selectedText = "";

    if (selection.rangeCount > 0) {
        savedRange = selection.getRangeAt(0).cloneRange();
        selectedText = selection.toString().trim();
    } else {
        savedRange = null;
    }

    linkUrlInput.value = "";

    // اگر کلمه‌ای انتخاب شده بود، فیلد متن نمایشی مخفی می‌شود
    if (selectedText) {
        linkTextGroup.style.display = "none";
        linkTextInput.value = selectedText;
    } else {
        linkTextGroup.style.display = "flex";
        linkTextInput.value = "";
    }

    showCustomModal("افزودن لینک", "link", () => {
        let url = linkUrlInput.value.trim();
        if (!url) return;

        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            url = "https://" + url;
        }

        const displayText = selectedText || linkTextInput.value.trim() || url;
        const linkHtml = `<a href="${url}" target="_blank" rel="noopener noreferrer">${displayText}</a>&nbsp;`;
        
        insertHtmlAtCursor(linkHtml, savedRange);
    });

    setTimeout(() => {
        linkUrlInput.focus();
    }, 150);
}

// Direct hyperlink open
noteContent.addEventListener("click", (e) => {
    const link = e.target.closest("a");
    if (link && link.href) {
        e.preventDefault();
        window.open(link.href, "_blank");
    }
});

// Table helpers
function getSelectedTable() {
    const selection = window.getSelection();
    if (!selection.rangeCount) return null;
    let node = selection.getRangeAt(0).commonAncestorContainer;
    while (node && node.nodeName !== "TABLE") {
        node = node.parentElement;
    }
    return node;
}

// ——————————————————————————
// Event Handlers
// ——————————————————————————
boldBtn.addEventListener("click", () => { document.execCommand("bold"); noteContent.focus(); });
italicBtn.addEventListener("click", () => { document.execCommand("italic"); noteContent.focus(); });
underlineBtn.addEventListener("click", () => { document.execCommand("underline"); noteContent.focus(); });
insertUnorderedListBtn.addEventListener("click", () => { document.execCommand("insertUnorderedList"); noteContent.focus(); });
insertOrderedListBtn.addEventListener("click", () => { document.execCommand("insertOrderedList"); noteContent.focus(); });

if (insertLinkBtn) insertLinkBtn.addEventListener("click", openLinkModal);

// Animated RTL/LTR toggle
rtlLtrBtn.addEventListener("click", () => {
    noteContent.classList.add("direction-animating");
    const nextDir = noteContent.style.direction === "ltr" ? "rtl" : "ltr";
    noteContent.style.direction = nextDir;
    
    setTimeout(() => {
        noteContent.classList.remove("direction-animating");
    }, 320);

    handleInputUpdate();
});

newNoteBtn.addEventListener("click", async () => {
    if (currentNoteIndex !== -1) await saveNotes();

    const newNote = {
        title: "",
        content: "",
        lastEdited: Date.now(),
        pinned: false,
    };

    const id = await addNote(newNote);
    newNote.id = id;
    notes.unshift(newNote);
    currentNoteIndex = 0;
    renderNotes();
    loadNoteWithTransition();
    noteTitle.focus();
});

// Table insertion
insertTableBtn.addEventListener("click", () => {
    showCustomModal("ابعاد جدول مورد نظر را تعیین فرمایید:", "form", () => {
        const rows = parseInt(tableRowsInput.value);
        const cols = parseInt(tableColsInput.value);

        if (isNaN(rows) || isNaN(cols) || rows <= 0 || cols <= 0) {
            showCustomModal("لطفاً مقادیر معتبر وارد نمایید.", "error");
            return;
        }

        let tableHTML = "<table class='note-table'><thead><tr>";
        for (let j = 0; j < cols; j++) {
            tableHTML += `<th>ستون ${j + 1}</th>`;
        }
        tableHTML += "</tr></thead><tbody>";
        for (let i = 0; i < rows; i++) {
            tableHTML += "<tr>";
            for (let j = 0; j < cols; j++) {
                tableHTML += "<td contenteditable='true'></td>";
            }
            tableHTML += "</tr>";
        }
        tableHTML += "</tbody></table><p><br></p>";

        insertHtmlAtCursor(tableHTML);
    });
});

addRowBtn.addEventListener("click", async () => {
    const table = getSelectedTable();
    if (!table) {
        showCustomModal("لطفاً ابتدا روی جدول مورد نظر کلیک فرمایید.", "error");
        return;
    }
    const colCount = table.rows[0].cells.length;
    const newRow = table.insertRow(-1);
    for (let i = 0; i < colCount; i++) {
        const newCell = newRow.insertCell(-1);
        newCell.contentEditable = "true";
    }
    handleInputUpdate();
});

addColumnBtn.addEventListener("click", async () => {
    const table = getSelectedTable();
    if (!table) {
        showCustomModal("لطفاً ابتدا روی جدول مورد نظر کلیک فرمایید.", "error");
        return;
    }
    for (let i = 0; i < table.rows.length; i++) {
        const newCell = table.rows[i].insertCell(-1);
        if (i === 0 && table.rows[0].cells[0].tagName === "TH") {
            newCell.outerHTML = `<th>ستون جدید</th>`;
        } else {
            newCell.contentEditable = "true";
        }
    }
    handleInputUpdate();
});

// Color picker
colorBtn.addEventListener("click", () => colorPicker.click());
colorPicker.addEventListener("input", (e) => {
    document.execCommand("foreColor", false, e.target.value);
    handleInputUpdate();
});

fontSizeSelect.addEventListener("change", (e) => {
    const size = e.target.value;
    if (!size) return;
    const selection = window.getSelection();
    if (selection.rangeCount) {
        const span = document.createElement("span");
        span.style.fontSize = size;
        span.appendChild(selection.getRangeAt(0).extractContents());
        selection.getRangeAt(0).insertNode(span);
        handleInputUpdate();
    }
    fontSizeSelect.selectedIndex = 0;
});

hrBtn.addEventListener("click", () => {
    insertHtmlAtCursor("<hr><p><br></p>");
});

saveNoteBtn.addEventListener("click", async () => {
    if (currentNoteIndex === -1) {
        showCustomModal("ابتدا یادداشتی را انتخاب یا ایجاد نمایید.", "error");
        return;
    }
    await saveNotes();
    showCustomModal("یادداشت با موفقیت ذخیره گردید.", "success");
});

toggleSidebarBtn.addEventListener("click", () => {
    isSidebarHidden = !isSidebarHidden;
    updateSidebarState();
});

searchInput.addEventListener("input", () => {
    const term = searchInput.value.toLowerCase().trim();
    const filtered = notes.filter((n) => {
        const titleMatch = (n.title || "").toLowerCase().includes(term);
        const contentMatch = stripHtml(n.content || "").toLowerCase().includes(term);
        return titleMatch || contentMatch;
    });
    renderNotes(filtered);
});

// Drag & Drop Image
noteContent.addEventListener("dragover", (e) => e.preventDefault());
noteContent.addEventListener("drop", (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file || !file.type.startsWith("image/")) {
        showCustomModal("تنها فایل‌های تصویری مجاز هستند.", "error");
        return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
        const img = `<img src="${event.target.result}" style="max-width: 100%; border-radius: 8px; margin: 12px 0; box-shadow: 0 4px 12px rgba(0,0,0,0.1);"><p><br></p>`;
        insertHtmlAtCursor(img);
    };
    reader.readAsDataURL(file);
});

// Auto-save
function handleInputUpdate() {
    clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout(async () => {
        if (currentNoteIndex !== -1) {
            await saveNotes();
        }
    }, 800);
}

noteContent.addEventListener("input", handleInputUpdate);
noteTitle.addEventListener("input", handleInputUpdate);

// Shortcuts
document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        saveNotes();
        showCustomModal("یادداشت با موفقیت ذخیره گردید.", "success");
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        openLinkModal();
    }
});

// Export & Import
exportNotesBtn.addEventListener("click", async () => {
    if (notes.length === 0) {
        showCustomModal("هیچ یادداشتی جهت خروجی گرفتن وجود ندارد.", "error");
        return;
    }
    if (currentNoteIndex !== -1) await saveNotes();

    const blob = new Blob([JSON.stringify(notes, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `notes-backup-${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showCustomModal("پشتیبان با موفقیت دریافت شد.", "success");
});

importNotesBtn.addEventListener("click", () => importFileInput.click());

importFileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
        try {
            const imported = JSON.parse(event.target.result);
            if (!Array.isArray(imported)) throw new Error();

            const tx = db.transaction(STORE_NAME, "readwrite");
            await tx.objectStore(STORE_NAME).clear();

            for (const item of imported) {
                const { id, ...data } = item;
                const newId = await addNote(data);
                data.id = newId;
            }
            notes = await getAllNotes();
            currentNoteIndex = notes.length > 0 ? 0 : -1;
            renderNotes();
            loadNoteWithTransition();
            showCustomModal("یادداشت‌ها با موفقیت وارد شدند.", "success");
        } catch {
            showCustomModal("فایل وارد شده ساختار معتبری ندارد.", "error");
        } finally {
            importFileInput.value = "";
        }
    };
    reader.readAsText(file);
});

// Theme Management
themeBtn.addEventListener("click", () => {
    body.classList.toggle("dark-mode");
    const isDark = body.classList.contains("dark-mode");
    localStorage.setItem("theme", isDark ? "dark" : "light");
});

if (localStorage.getItem("theme") === "dark") {
    body.classList.add("dark-mode");
}

// ——————————————————————————
// Init
// ——————————————————————————
async function initApp() {
    try {
        await openDB();
        notes = await getAllNotes();

        // LocalStorage migration check
        const local = localStorage.getItem("notes");
        if (local && !notes.length) {
            try {
                const parsed = JSON.parse(local);
                for (const item of parsed) await addNote(item);
                notes = await getAllNotes();
                localStorage.removeItem("notes");
            } catch (err) {
                console.warn(err);
            }
        }

        if (notes.length > 0) {
            currentNoteIndex = 0;
        }

        renderNotes();
        loadNote();
    } catch (err) {
        showCustomModal("خطا در بارگذاری پایگاه داده: " + err.message, "error");
    }
}

initApp();