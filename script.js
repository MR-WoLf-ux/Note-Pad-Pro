const $ = document;
const body = $.body;
const themeBtn = $.getElementById("theme-btn");
const newNoteBtn = $.getElementById("new-note");
const noteList = $.getElementById("note-list");
const insertTableBtn = $.getElementById("insert-table-btn");
const addRowBtn = $.getElementById("add-row-btn");
const addColumnBtn = $.getElementById("add-column-btn");
const noteTitle = $.getElementById("note-title");
const fontSizeSelect = $.getElementById("font-size-select");
const noteContent = $.getElementById("note-content");
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
const customModal = $.getElementById("custom-modal");
const modalMessage = $.getElementById("modal-message");
const modalIcon = $.querySelector(".modal-icon");
const modalCloseBtn = $.getElementById("modal-close-btn");
const modalConfirmBtn = $.getElementById("modal-confirm-btn");
const modalCancelBtn = $.getElementById("modal-cancel-btn");
const modalForm = $.getElementById("modal-form");
const tableRowsInput = $.getElementById("table-rows");
const tableColsInput = $.getElementById("table-cols");
const toggleSidebarBtn = $.getElementById("toggle-sidebar-btn");
const sidebar = $.getElementById("sidebar");
const noteEditor = $.getElementById("note-editor");

let notes = [];
let currentNoteIndex = -1;
let db;
let autoSaveTimeout;

// ——————————————————————————
// IndexedDB Setup
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
                store.createIndex("lastEdited", "lastEdited", {
                    unique: false,
                });
                store.createIndex("pinned", "pinned", { unique: false });
            }
        };
    });
}

// ——————————————————————————
// CRUD Operations
// ——————————————————————————
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
// Modal Functions
// ——————————————————————————
function showCustomModal(message, type = "success", onConfirm = null) {
    modalMessage.textContent = message;
    modalIcon.className = "modal-icon";
    modalCloseBtn.style.display =
        type === "confirm" || type === "form" ? "none" : "inline-block";
    modalConfirmBtn.style.display =
        type === "confirm" || type === "form" ? "inline-block" : "none";
    modalCancelBtn.style.display =
        type === "confirm" || type === "form" ? "inline-block" : "none";
    modalForm.style.display = type === "form" ? "block" : "none";

    if (type === "success") modalIcon.classList.add("success");
    else if (type === "error") modalIcon.classList.add("error");
    else if (type === "confirm" || type === "form")
        modalIcon.classList.add("question");

    customModal.style.display = "flex";
    customModal.classList.remove("hide");
    customModal.classList.add("show");
    customModal.querySelector(".modal").classList.remove("hide");
    customModal.querySelector(".modal").classList.add("show");

    if (type === "success") {
        setTimeout(closeCustomModal, 3000);
    }

    if ((type === "confirm" || type === "form") && onConfirm) {
        const confirmHandler = () => {
            onConfirm();
            closeCustomModal();
            modalConfirmBtn.removeEventListener("click", confirmHandler);
        };
        const cancelHandler = () => {
            closeCustomModal();
            modalCancelBtn.removeEventListener("click", cancelHandler);
        };
        modalConfirmBtn.addEventListener("click", confirmHandler);
        modalCancelBtn.addEventListener("click", cancelHandler);
    }
}

function closeCustomModal() {
    customModal.classList.remove("show");
    customModal.classList.add("hide");
    customModal.querySelector(".modal").classList.remove("show");
    customModal.querySelector(".modal").classList.add("hide");
    customModal.addEventListener("transitionend", function handler() {
        customModal.style.display = "none";
        customModal.removeEventListener("transitionend", handler);
    });
}

modalCloseBtn.addEventListener("click", closeCustomModal);
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && customModal.style.display === "flex")
        closeCustomModal();
});

// ——————————————————————————
// App Initialization
// ——————————————————————————
async function initApp() {
    try {
        await openDB();
        notes = await getAllNotes();

        // مهاجرت از localStorage اگر وجود داشته باشد
        const localNotes = localStorage.getItem("notes");
        if (localNotes && !notes.length) {
            try {
                const oldNotes = JSON.parse(localNotes);
                for (const note of oldNotes) {
                    const id = await addNote(note);
                    note.id = id;
                }
                notes = await getAllNotes();
                localStorage.removeItem("notes");
                showCustomModal(
                    "داده‌های قدیمی به IndexedDB منتقل شد.",
                    "success"
                );
            } catch (e) {
                console.warn("خطا در مهاجرت از localStorage:", e);
            }
        }

        renderNotes();
        loadNote();
    } catch (err) {
        showCustomModal("خطا در اتصال به دیتابیس: " + err.message, "error");
        console.error("IndexedDB Error:", err);
    }
}

// ——————————————————————————
// Save & Render Functions
// ——————————————————————————
async function saveNotes() {
    if (currentNoteIndex === -1) return;
    const note = notes[currentNoteIndex];
    note.title = noteTitle.value;
    note.content = noteContent.innerHTML;
    note.lastEdited = Date.now();
    await updateNote(note);
    // بدون renderNotes → فقط ذخیره
}

async function renderNotes(notesToRender = notes) {
    noteList.innerHTML = "";
    const sortedNotes = [...notesToRender].sort((a, b) => b.pinned - a.pinned);

    sortedNotes.forEach((note, index) => {
        const li = document.createElement("li");
        li.style.setProperty("--index", index);

        let wordCount = note.content
            ? note.content
                  .replace(/<[^>]*>/g, "")
                  .split(/\s+/)
                  .filter((w) => w).length
            : 0;
        let preview = `تعداد کلمات: ${wordCount}`;

        if (wordCount > 50) {
            preview += `<br>${note.content
                .replace(/<[^>]*>/g, "")
                .substring(0, 100)}...`;
        }
        if (note.lastEdited) {
            preview += `<br>آخرین ویرایش: ${new Date(
                note.lastEdited
            ).toLocaleDateString("fa-IR")}`;
        }

        const noteText = document.createElement("span");
        noteText.innerHTML = `<b>${note.title || "یادداشت بدون عنوان"}</b>`;

        const notePreview = document.createElement("p");
        notePreview.className = "note-preview";
        notePreview.innerHTML = preview;

        const deleteButton = document.createElement("button");
        deleteButton.className = "delete-note";
        deleteButton.textContent = "×";
        deleteButton.addEventListener("click", (e) => {
            e.stopPropagation();
            const originalIndex = notes.indexOf(note);
            showCustomModal(
                "آیا مطمئن به حذف این یادداشت هستید؟",
                "confirm",
                async () => {
                    await deleteNote(note.id);
                    notes.splice(originalIndex, 1);
                    if (currentNoteIndex === originalIndex) {
                        currentNoteIndex = -1;
                        loadNote();
                    } else if (currentNoteIndex > originalIndex) {
                        currentNoteIndex--;
                    }
                    renderNotes();
                }
            );
        });

        const pinButton = document.createElement("button");
        pinButton.className = "pin-note";
        pinButton.textContent = note.pinned ? "Unpin" : "Pin";
        pinButton.addEventListener("click", (e) => {
            e.stopPropagation();
            note.pinned = !note.pinned;
            updateNote(note).then(() => renderNotes());
        });

        li.dataset.noteId = note.id;
        li.appendChild(pinButton);
        li.appendChild(noteText);
        li.appendChild(notePreview);
        li.appendChild(deleteButton);

        li.addEventListener("click", () => {
            currentNoteIndex = notes.indexOf(note);
            loadNote();
            li.classList.add("selected");
            setTimeout(() => li.classList.remove("selected"), 300);
        });

        noteList.appendChild(li);
    });
}

function loadNote() {
    if (currentNoteIndex !== -1 && notes[currentNoteIndex]) {
        const note = notes[currentNoteIndex];
        noteTitle.value = note.title || "";
        noteContent.innerHTML = note.content || "";
        noteContent.classList.add("fade-in");
        setTimeout(() => noteContent.classList.remove("fade-in"), 300);
    } else {
        noteTitle.value = "";
        noteContent.innerHTML = "";
    }
}

// ——————————————————————————
// Editor Tools
// ——————————————————————————
function placeCursorAtEnd(element) {
    const range = document.createRange();
    const selection = window.getSelection();
    range.selectNodeContents(element);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
    element.focus();
}

function insertHtmlAtCursor(html) {
    if (document.activeElement !== noteContent) {
        noteContent.focus();
    }

    const selection = window.getSelection();
    let range;

    if (selection.rangeCount > 0) {
        range = selection.getRangeAt(0);
    } else {
        range = document.createRange();
        range.selectNodeContents(noteContent);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
    }

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

    saveNotes();
}

// Table functions
function getSelectedTable() {
    const selection = window.getSelection();
    if (!selection.rangeCount) return null;
    const range = selection.getRangeAt(0);
    let node = range.commonAncestorContainer;
    while (node && node.nodeName !== "TABLE") {
        node = node.parentElement;
    }
    return node;
}

function getSelectedRow() {
    const selection = window.getSelection();
    if (!selection.rangeCount) return null;
    const range = selection.getRangeAt(0);
    let node = range.commonAncestorContainer;
    while (node && node.nodeName !== "TR") {
        node = node.parentElement;
    }
    return node;
}

// ——————————————————————————
// Event Listeners
// ——————————————————————————
boldBtn.addEventListener("click", () =>
    document.execCommand("bold", false, null)
);
italicBtn.addEventListener("click", () =>
    document.execCommand("italic", false, null)
);
underlineBtn.addEventListener("click", () =>
    document.execCommand("underline", false, null)
);
insertUnorderedListBtn.addEventListener("click", () =>
    document.execCommand("insertUnorderedList", false, null)
);
insertOrderedListBtn.addEventListener("click", () =>
    document.execCommand("insertOrderedList", false, null)
);

rtlLtrBtn.addEventListener("click", () => {
    noteContent.style.direction =
        noteContent.style.direction === "rtl" ? "ltr" : "rtl";
    noteContent.classList.add("fade-in");
    setTimeout(() => noteContent.classList.remove("fade-in"), 300);
    saveNotes();
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
    notes.push(newNote);
    currentNoteIndex = notes.length - 1;
    renderNotes();
    loadNote();
});

insertTableBtn.addEventListener("click", () => {
    showCustomModal(
        "لطفاً تعداد سطرها و ستون‌های جدول را وارد کنید:",
        "form",
        () => {
            const rows = parseInt(tableRowsInput.value);
            const cols = parseInt(tableColsInput.value);

            if (isNaN(rows) || isNaN(cols) || rows <= 0 || cols <= 0) {
                showCustomModal(
                    "لطفاً اعداد صحیح و بزرگتر از صفر وارد کنید.",
                    "error"
                );
                return;
            }

            let tableHTML = "<table class='note-table'>";
            for (let i = 0; i < rows; i++) {
                tableHTML += "<tr>";
                for (let j = 0; j < cols; j++) {
                    if (i === 0) {
                        tableHTML += `<th>سربرگ ${j + 1}</th>`;
                    } else {
                        tableHTML += "<td contenteditable='true'></td>";
                    }
                }
                tableHTML += "</tr>";
            }
            tableHTML += "</table><p><br></p>";

            noteContent.focus();

            const range = document.createRange();
            const selection = window.getSelection();
            range.selectNodeContents(noteContent);
            range.collapse(false);
            selection.removeAllRanges();
            selection.addRange(range);

            insertHtmlAtCursor(tableHTML);
        }
    );

    tableRowsInput.value = "3";
    tableColsInput.value = "3";
});

addRowBtn.addEventListener("click", async () => {
    const table = getSelectedTable();
    if (!table) {
        showCustomModal("لطفاً ابتدا روی یک جدول کلیک کنید.", "error");
        return;
    }

    const rowCount = table.rows.length;
    const colCount = table.rows[0].cells.length;
    const newRow = table.insertRow(-1);
    newRow.classList.add("fade-in");

    for (let i = 0; i < colCount; i++) {
        const newCell = newRow.insertCell(-1);

        newCell.contentEditable = true;
        newCell.textContent = "";

        if (i === 0 && rowCount === 0) {
            newCell.tagName = "TH";
            newCell.className = "note-table-th";
        } else {
            newCell.className = "note-table-td";
        }
    }

    setTimeout(() => newRow.classList.remove("fade-in"), 300);
    await saveNotes();
});

addColumnBtn.addEventListener("click", async () => {
    const table = getSelectedTable();
    if (!table) {
        showCustomModal("لطفاً ابتدا روی یک جدول کلیک کنید.", "error");
        return;
    }

    const rowCount = table.rows.length;
    for (let i = 0; i < rowCount; i++) {
        const newCell = table.rows[i].insertCell(-1);
        newCell.classList.add("fade-in");
        newCell.contentEditable = true;

        if (i === 0) {
            newCell.outerHTML = `<th class="note-table-th">سربرگ ${table.rows[0].cells.length}</th>`;
        } else {
            newCell.className = "note-table-td";
            newCell.textContent = "";
        }

        setTimeout(() => newCell.classList.remove("fade-in"), 300);
    }
    await saveNotes();
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Delete") {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;

        const range = selection.getRangeAt(0);
        const selectedRow = getSelectedRow();

        if (!selectedRow) return;

        const rowText = selectedRow.textContent.trim();
        const selectedText = selection.toString().trim();

        const isWholeRowSelected =
            selectedText === rowText && selectedText !== "";

        const isRangeCoveringWholeRow =
            range.startContainer === selectedRow ||
            range.startContainer.parentElement === selectedRow ||
            range.commonAncestorContainer === selectedRow;

        if (
            (isWholeRowSelected || isRangeCoveringWholeRow) &&
            selectedRow.parentElement.rows.length > 1
        ) {
            event.preventDefault();
            selectedRow.classList.add("fade-out");
            setTimeout(() => {
                selectedRow.remove();
                saveNotes();
            }, 300);
        }
    }
});

colorBtn.addEventListener("click", () => colorPicker.click());

colorPicker.addEventListener("change", (event) => {
    const selectedColor = event.target.value;
    const selection = window.getSelection();
    if (selection.rangeCount) {
        const range = selection.getRangeAt(0);
        const selectedText = range.extractContents();
        const span = document.createElement("span");
        span.style.color = selectedColor;
        span.classList.add("fade-in");
        span.appendChild(selectedText);
        range.insertNode(span);
        setTimeout(() => span.classList.remove("fade-in"), 300);
        saveNotes();
    }
});

fontSizeSelect.addEventListener("change", (event) => {
    const selectedFontSize = event.target.value;
    if (!selectedFontSize) return;

    const selection = window.getSelection();
    if (selection.rangeCount) {
        const range = selection.getRangeAt(0);
        const span = document.createElement("span");
        span.style.fontSize = selectedFontSize;
        span.classList.add("fade-in");
        span.appendChild(range.extractContents());
        range.insertNode(span);
        setTimeout(() => span.classList.remove("fade-in"), 300);
        saveNotes();
    }
    fontSizeSelect.selectedIndex = 0;
});

hrBtn.addEventListener("click", () => {
    const selection = window.getSelection();
    if (selection.rangeCount) {
        const range = selection.getRangeAt(0);
        const hr = document.createElement("hr");
        hr.classList.add("fade-in");

        if (!selection.isCollapsed) {
            range.deleteContents();
        }

        range.insertNode(hr);
        const br = document.createElement("br");
        range.insertNode(br);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);

        setTimeout(() => hr.classList.remove("fade-in"), 300);
        saveNotes();
    }
});

saveNoteBtn.addEventListener("click", async () => {
    if (currentNoteIndex === -1) {
        showCustomModal("لطفا ابتدا یک یادداشت جدید ایجاد کنید", "error");
        return;
    }
    await saveNotes();
    showCustomModal("یادداشت ذخیره شد", "success");
});

toggleSidebarBtn.addEventListener("click", () => {
    sidebar.classList.toggle("hidden");
    toggleSidebarBtn.textContent = sidebar.classList.contains("hidden")
        ? "←"
        : "→";
    noteEditor.style.width = sidebar.classList.contains("hidden")
        ? "100%"
        : "calc(100% - 250px)";
});

searchInput.addEventListener("input", () => {
    const searchTerm = searchInput.value.toLowerCase();
    const filteredNotes = notes.filter((note) => {
        return (
            note.title.toLowerCase().includes(searchTerm) ||
            (note.content
                ? note.content
                      .replace(/<[^>]*>/g, "")
                      .toLowerCase()
                      .includes(searchTerm)
                : false)
        );
    });
    renderNotes(filteredNotes);
});

// Drag & Drop Images
noteContent.addEventListener("dragover", (event) => {
    event.preventDefault();
});

noteContent.addEventListener("drop", (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (!file || !file.type.startsWith("image/")) {
        showCustomModal(
            "لطفاً فقط فایل‌های تصویری (مثل PNG یا JPEG) را دراپ کنید.",
            "error"
        );
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const img = document.createElement("img");
        img.src = e.target.result;
        img.style.maxWidth = "100%";
        img.style.maxHeight = "300px";
        img.style.borderRadius = "8px";
        img.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.1)";
        img.classList.add("fade-in");
        noteContent.appendChild(img);
        setTimeout(() => img.classList.remove("fade-in"), 300);
        saveNotes();
    };
    reader.readAsDataURL(file);
});

// Auto-save on input (بدون رفرش لیست)
noteContent.addEventListener("input", () => {
    clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout(async () => {
        if (currentNoteIndex !== -1) {
            const note = notes[currentNoteIndex];
            note.content = noteContent.innerHTML;
            note.lastEdited = Date.now();
            await updateNote(note);
        }
    }, 1000);
});

noteTitle.addEventListener("input", () => {
    clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout(async () => {
        if (currentNoteIndex !== -1) {
            const note = notes[currentNoteIndex];
            note.title = noteTitle.value;
            note.lastEdited = Date.now();
            await updateNote(note);
        }
    }, 1000);
});

// Export/Import
exportNotesBtn.addEventListener("click", async () => {
    if (notes.length === 0) {
        showCustomModal("هیچ یادداشتی برای خروجی گرفتن وجود ندارد.", "error");
        return;
    }

    if (currentNoteIndex !== -1) await saveNotes();

    const dataStr = JSON.stringify(notes, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `notes-backup-${
        new Date().toISOString().split("T")[0]
    }.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showCustomModal("فایل با موفقیت دانلود شد.", "success");
});

importNotesBtn.addEventListener("click", () => importFileInput.click());

importFileInput.addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith(".json")) {
        showCustomModal("لطفاً یک فایل JSON معتبر انتخاب کنید.", "error");
        return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const importedNotes = JSON.parse(e.target.result);
            if (!Array.isArray(importedNotes)) {
                throw new Error("فایل JSON باید یک آرایه باشد.");
            }

            const deleteTx = db.transaction(STORE_NAME, "readwrite");
            const deleteStore = deleteTx.objectStore(STORE_NAME);
            await deleteStore.clear();

            const newNotes = [];
            for (const note of importedNotes) {
                const { id, ...noteWithoutId } = note;
                const newId = await addNote(noteWithoutId);
                noteWithoutId.id = newId;
                newNotes.push(noteWithoutId);
            }

            notes.length = 0;
            notes.push(...newNotes);
            currentNoteIndex = -1;
            renderNotes();
            loadNote();

            showCustomModal(`یادداشت ها با موفقیت وارد شدند`, "success");
        } catch (error) {
            showCustomModal(
                "خطا در وارد کردن یادداشت‌ها: " + error.message,
                "error"
            );
        } finally {
            importFileInput.value = "";
        }
    };
    reader.readAsText(file);
});

// Theme
themeBtn.addEventListener("click", () => {
    body.classList.toggle("dark-mode");
    body.classList.add("theme-transition");
    setTimeout(() => body.classList.remove("theme-transition"), 500);

    if (body.classList.contains("dark-mode")) {
        localStorage.setItem("theme", "dark");
    } else {
        localStorage.setItem("theme", "light");
    }
});

const savedTheme = localStorage.getItem("theme");
if (savedTheme === "dark") {
    body.classList.add("dark-mode");
}

// ——————————————————————————
// Styles & Animations
// ——————————————————————————
const style = document.createElement("style");
style.textContent = `
    .fade-in { animation: fadeIn 0.3s ease; }
    .fade-out { animation: fadeOut 0.3s ease; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes fadeOut { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(-10px); } }
    .theme-transition { transition: background-color 0.5s ease, color 0.5s ease; }
    #note-list li.selected { background-color: rgba(74, 144, 226, 0.1); transition: 0.3s; }
    #note-content table tr { opacity: 0; animation: tableRowFadeIn 0.3s ease forwards; }
    @keyframes tableRowFadeIn { to { opacity: 1; } }
    .note-table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
        margin: 15px 0;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .note-table th {
        background-color: #4a90e2;
        color: white;
        padding: 12px;
        text-align: center;
        font-weight: bold;
        border-bottom: 2px solid #3a78c2;
    }
    .note-table td {
        border: 1px solid #ddd;
        padding: 10px;
        min-width: 60px;
        min-height: 30px;
        background-color: #fff;
        transition: background-color 0.2s;
    }
    .note-table td:hover { background-color: #f0f8ff; }

    body.dark-mode .note-table th {
        background-color: #1a5fb4;
        border-bottom-color: #144c91;
    }
    body.dark-mode .note-table td {
        background-color: #2a2a2a;
        border-color: #555;
        color: #ddd;
    }
    body.dark-mode .note-table td:hover { background-color: #3a3a3a; }
`;
document.head.appendChild(style);

// ——————————————————————————
// Start Application
// ——————————————————————————
initApp();

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker
            .register("/service-worker.js")
            .then((registration) => {
                console.log("Service Worker registered:", registration);
            })
            .catch((error) => {
                console.error("Service Worker registration failed:", error);
            });
    });
}
