const body = document.body;
const themeBtn = document.getElementById("theme-btn");
const newNoteBtn = document.getElementById("new-note");
const noteList = document.getElementById("note-list");
const todoBtn = document.getElementById("todo-btn");
const insertTableBtn = document.getElementById("insert-table-btn");
const addRowBtn = document.getElementById("add-row-btn");
const addColumnBtn = document.getElementById("add-column-btn");
const noteTitle = document.getElementById("note-title");
const fontSizeSelect = document.getElementById("font-size-select");
const noteContent = document.getElementById("note-content");
const colorBtn = document.getElementById("color-btn");
const colorPicker = document.getElementById("color-picker");
const hrBtn = document.getElementById("hr-btn");
const searchInput = document.getElementById("search-notes");
const saveNoteBtn = document.getElementById("save-note");
const boldBtn = document.getElementById("bold-btn");
const italicBtn = document.getElementById("italic-btn");
const underlineBtn = document.getElementById("underline-btn");
const insertUnorderedListBtn = document.getElementById("insert-unordered-list");
const insertOrderedListBtn = document.getElementById("insert-ordered-list");
const codeBlockBtn = document.getElementById("code-block-btn");
const rtlLtrBtn = document.getElementById("rtl-ltr-btn");
const exportNotesBtn = document.getElementById("export-notes-btn");
const importNotesBtn = document.getElementById("import-notes-btn");
const importFileInput = document.getElementById("import-file-input");
const customModal = document.getElementById("custom-modal");
const modalMessage = document.getElementById("modal-message");
const modalIcon = document.querySelector(".modal-icon");
const modalCloseBtn = document.getElementById("modal-close-btn");

let notes = JSON.parse(localStorage.getItem("notes")) || [];
let currentNoteIndex = -1;

// تابع نمایش Modal
function showCustomModal(message, type = "success") {
    modalMessage.textContent = message;
    modalIcon.className = "modal-icon";
    if (type === "success") {
        modalIcon.classList.add("success");
    } else if (type === "error") {
        modalIcon.classList.add("error");
    }
    customModal.style.display = "flex";
    customModal.classList.remove("hide");
    customModal.classList.add("show");
    customModal.querySelector(".modal").classList.remove("hide");
    customModal.querySelector(".modal").classList.add("show");
    if (type === "success") {
        setTimeout(() => {
            closeCustomModal();
        }, 3000);
    }
}

// تابع بستن Modal
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

// بستن Modal با دکمه
modalCloseBtn.addEventListener("click", closeCustomModal);

// بستن Modal با کلید Esc
document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && customModal.style.display === "flex") {
        closeCustomModal();
    }
});

const savedTheme = localStorage.getItem("theme");
if (savedTheme === "dark") {
    body.classList.add("dark-mode");
}

notes = notes.map((note) => ({ ...note, pinned: note.pinned || false }));
saveNotes();

function saveNotes() {
    if (currentNoteIndex !== -1) {
        notes[currentNoteIndex].title = noteTitle.value;
        notes[currentNoteIndex].content = noteContent.innerHTML;
        notes[currentNoteIndex].lastEdited = new Date().getTime();
    }
    localStorage.setItem("notes", JSON.stringify(notes));
    renderNotes();
}

function renderNotes(notesToRender = notes) {
    noteList.innerHTML = "";
    const sortedNotes = [...notesToRender].sort((a, b) => b.pinned - a.pinned);
    sortedNotes.forEach((note, index) => {
        const li = document.createElement("li");
        let wordCount = note.content
            ? note.content
                  .replace(/<[^>]*>/g, "")
                  .split(/\s+/)
                  .filter((word) => word !== "").length
            : 0;
        let preview = `تعداد کلمات: ${wordCount}`;
        if (wordCount > 50) {
            preview += `<br>${
                note.content
                    ? note.content.replace(/<[^>]*>/g, "").substring(0, 100) +
                      "..."
                    : ""
            }`;
        }
        if (note.lastEdited) {
            let lastEdited = new Date(note.lastEdited).toLocaleDateString(
                "fa-IR"
            );
            preview += `<br>آخرین ویرایش: ${lastEdited}`;
        }
        const noteText = document.createElement("span");
        noteText.innerHTML = `<b>${note.title || "یادداشت بدون عنوان"}</b>`;
        const notePreview = document.createElement("p");
        notePreview.className = "note-preview";
        notePreview.innerHTML = preview;
        const deleteButton = document.createElement("button");
        deleteButton.className = "delete-note";
        deleteButton.dataset.index = index;
        deleteButton.textContent = "×";
        deleteButton.addEventListener("click", (event) => {
            event.stopPropagation();
            const indexToDelete = parseInt(event.target.dataset.index);
            const originalIndex = notes.indexOf(sortedNotes[indexToDelete]);
            if (confirm("آیا مطمئن به حذف این یادداشت هستید؟")) {
                notes.splice(originalIndex, 1);
                if (currentNoteIndex === originalIndex) {
                    currentNoteIndex = -1;
                    loadNote();
                } else if (currentNoteIndex > originalIndex) {
                    currentNoteIndex--;
                }
                saveNotes();
            }
        });
        const pinButton = document.createElement("button");
        pinButton.className = "pin-note";
        pinButton.textContent = note.pinned ? "Unpin" : "Pin";
        pinButton.addEventListener("click", (event) => {
            event.stopPropagation();
            note.pinned = !note.pinned;
            saveNotes();
        });
        li.dataset.originalIndex = notes.indexOf(note);
        li.appendChild(pinButton);
        li.appendChild(noteText);
        li.appendChild(notePreview);
        li.appendChild(deleteButton);
        li.addEventListener("click", () => {
            currentNoteIndex = parseInt(li.dataset.originalIndex);
            loadNote();
        });
        noteList.appendChild(li);
    });
}

function insertHtmlAtCursor(html) {
    let range, selection;
    if (document.createRange) {
        selection = window.getSelection();
        if (selection.getRangeAt && selection.rangeCount) {
            range = selection.getRangeAt(0);
            range.deleteContents();
            let tempDiv = document.createElement("div");
            tempDiv.innerHTML = html;
            let fragment = document.createDocumentFragment();
            let node;
            while ((node = tempDiv.firstChild)) {
                fragment.appendChild(node);
            }
            range.insertNode(fragment);
        }
    } else if (document.selection && document.selection.createRange) {
        document.selection.createRange().pasteHTML(html);
    }
}

function loadNote() {
    if (currentNoteIndex !== -1) {
        noteTitle.value = notes[currentNoteIndex].title;
        noteContent.innerHTML = notes[currentNoteIndex].content;
    } else {
        noteTitle.value = "";
        noteContent.innerHTML = "";
    }
}

function surroundSelection(tag) {
    document.execCommand(tag, false, null);
}

boldBtn.addEventListener("click", () => surroundSelection("bold"));
italicBtn.addEventListener("click", () => surroundSelection("italic"));
underlineBtn.addEventListener("click", () => surroundSelection("underline"));
insertUnorderedListBtn.addEventListener("click", () => surroundSelection("insertUnorderedList"));
insertOrderedListBtn.addEventListener("click", () => surroundSelection("insertOrderedList"));

document.addEventListener("keydown", function (event) {
    if (event.ctrlKey && event.shiftKey && event.key === "C") {
        document.execCommand("formatBlock", false, "pre");
    }
});

codeBlockBtn.addEventListener("click", () => {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    const range = selection.getRangeAt(0);
    const selectedText = range.toString();
    if (selectedText) {
        const pre = document.createElement("pre");
        pre.textContent = selectedText;
        range.deleteContents();
        range.insertNode(pre);
    } else {
        const pre = document.createElement("pre");
        noteContent.appendChild(pre);
        pre.focus();
    }
    saveNotes();
});

rtlLtrBtn.addEventListener("click", () => {
    noteContent.style.direction =
        noteContent.style.direction === "rtl" ? "ltr" : "rtl";
    saveNotes();
});

newNoteBtn.addEventListener("click", () => {
    notes.push({ title: "", content: "", lastEdited: new Date().getTime() });
    currentNoteIndex = notes.length - 1;
    saveNotes();
    renderNotes();
    loadNote();
});

insertTableBtn.addEventListener("click", () => {
    const cols = parseInt(prompt("تعداد ستون‌ها:", "3"));
    const rows = parseInt(prompt("تعداد سطرها:", "3"));
    if (isNaN(rows) || isNaN(cols) || rows <= 0 || cols <= 0) {
        showCustomModal("لطفاً اعداد صحیح و بزرگتر از صفر وارد کنید.", "error");
        return;
    }
    let tableHTML = "<table style='width: 100%; border-collapse: separate; border-spacing: 0;'>";
    for (let i = 0; i < rows; i++) {
        tableHTML += "<tr>";
        for (let j = 0; j < cols; j++) {
            if (i === 0) {
                tableHTML += "<th style='border: 1px solid #ddd; padding: 10px; text-align: center;'>سربرگ " + (j + 1) + "</th>";
            } else {
                tableHTML += "<td style='border: 1px solid #ddd; padding: 10px; text-align: center;'></td>";
            }
        }
        tableHTML += "</tr>";
    }
    tableHTML += "</table>";
    insertHtmlAtCursor(tableHTML);
});

// تابع پیدا کردن جدول انتخاب‌شده
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

// تابع پیدا کردن سطر انتخاب‌شده
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

// حذف سطر انتخاب‌شده با کلید Delete
document.addEventListener("keydown", (event) => {
    if (event.key === "Delete") {
        const row = getSelectedRow();
        if (row) {
            const table = row.parentElement.parentElement;
            if (table.rows.length > 1) {
                row.remove();
                saveNotes();
            } else {
                showCustomModal("نمی‌توانید آخرین سطر جدول را حذف کنید.", "error");
            }
        }
    }
});

// افزودن سطر جدید به جدول
addRowBtn.addEventListener("click", () => {
    const table = getSelectedTable();
    if (!table) {
        showCustomModal("لطفاً ابتدا روی یک جدول کلیک کنید.", "error");
        return;
    }
    const rowCount = table.rows.length;
    const colCount = table.rows[0].cells.length;
    const newRow = table.insertRow(-1);
    for (let i = 0; i < colCount; i++) {
        const newCell = newRow.insertCell(-1);
        newCell.style.border = "1px solid #ddd";
        newCell.style.padding = "10px";
        newCell.style.textAlign = "center";
        newCell.textContent = "";
    }
    saveNotes();
});

// افزودن ستون جدید به جدول
addColumnBtn.addEventListener("click", () => {
    const table = getSelectedTable();
    if (!table) {
        showCustomModal("لطفاً ابتدا روی یک جدول کلیک کنید.", "error");
        return;
    }
    const rowCount = table.rows.length;
    for (let i = 0; i < rowCount; i++) {
        const newCell = table.rows[i].insertCell(-1);
        newCell.style.border = "1px solid #ddd";
        newCell.style.padding = "10px";
        newCell.style.textAlign = "center";
        if (i === 0) {
            newCell.outerHTML = `<th style='border: 1px solid #ddd; padding: 10px; text-align: center;'>سربرگ ${table.rows[0].cells.length}</th>`;
        } else {
            newCell.textContent = "";
        }
    }
    saveNotes();
});

themeBtn.addEventListener("click", () => {
    body.classList.toggle("dark-mode");
    if (body.classList.contains("dark-mode")) {
        localStorage.setItem("theme", "dark");
    } else {
        localStorage.setItem("theme", "light");
    }
});

colorBtn.addEventListener("click", () => {
    colorPicker.click();
});

colorPicker.addEventListener("change", (event) => {
    const selectedColor = event.target.value;
    const selection = window.getSelection();
    if (selection.rangeCount) {
        const range = selection.getRangeAt(0);
        const selectedText = range.extractContents();
        const span = document.createElement("span");
        span.style.color = selectedColor;
        span.appendChild(selectedText);
        range.insertNode(span);
        saveNotes();
    }
});

fontSizeSelect.addEventListener("change", (event) => {
    const selectedFontSize = event.target.value;
    const selection = window.getSelection();
    if (selection.rangeCount) {
        const range = selection.getRangeAt(0);
        const selectedNodes = range.cloneContents().childNodes;
        selectedNodes.forEach((node) => {
            if (
                node.nodeType === Node.ELEMENT_NODE &&
                node.style &&
                node.style.fontSize
            ) {
                node.style.removeProperty("font-size");
            }
        });
        const span = document.createElement("span");
        span.style.fontSize = selectedFontSize;
        span.appendChild(range.extractContents());
        range.insertNode(span);
        saveNotes();
    }
    fontSizeSelect.selectedIndex = 0;
});

todoBtn.addEventListener("click", () => {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    const range = selection.getRangeAt(0);
    const parentNode = range.commonAncestorContainer.parentElement.closest('.todo-item');
    if (parentNode) {
        return;
    }
    const todoSpan = document.createElement("span");
    todoSpan.classList.add("todo-item");
    todoSpan.innerHTML = '<span class="todo-checkbox"></span> ';
    range.insertNode(todoSpan);
    saveNotes();
});

saveNoteBtn.addEventListener("click", () => {
    if (currentNoteIndex !== -1) {
        notes[currentNoteIndex].title = noteTitle.value;
        notes[currentNoteIndex].content = noteContent.innerHTML;
        saveNotes();
        renderNotes();
        showCustomModal("یادداشت ذخیره شد", "success");
    } else {
        showCustomModal("لطفا ابتدا یک یادداشت جدید ایجاد کنید", "error");
    }
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

noteContent.addEventListener("dragover", (event) => {
    event.preventDefault();
});

noteContent.addEventListener("drop", (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (!file || !file.type.startsWith("image/")) {
        showCustomModal("لطفاً فقط فایل‌های تصویری (مثل PNG یا JPEG) را دراپ کنید.", "error");
        return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = document.createElement("img");
        img.src = e.target.result;
        img.style.maxWidth = "100%";
        img.style.maxHeight = "100%";
        noteContent.appendChild(img);
        saveNotes();
    };
    reader.readAsDataURL(file);
});

noteContent.addEventListener("click", (event) => {
    if (event.target.classList.contains("todo-checkbox")) {
        event.target.classList.toggle("checked");
        saveNotes();
    }
});

hrBtn.addEventListener("click", () => {
    const selection = window.getSelection();
    if (selection.rangeCount) {
        const range = selection.getRangeAt(0);
        const hr = document.createElement("hr");
        if (!selection.isCollapsed) {
            range.deleteContents();
        }
        range.insertNode(hr);
        const br = document.createElement("br");
        range.insertNode(br);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
        saveNotes();
    }
});

exportNotesBtn.addEventListener("click", () => {
    if (notes.length === 0) {
        showCustomModal("هیچ یادداشتی برای خروجی گرفتن وجود ندارد.", "error");
        return;
    }
    if (currentNoteIndex !== -1) {
        notes[currentNoteIndex].title = noteTitle.value;
        notes[currentNoteIndex].content = noteContent.innerHTML;
        notes[currentNoteIndex].lastEdited = new Date().getTime();
        localStorage.setItem("notes", JSON.stringify(notes));
    }
    const dataStr = JSON.stringify(notes, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "notes-backup.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
});

importNotesBtn.addEventListener("click", () => {
    importFileInput.click();
});

importFileInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (!file.name.endsWith(".json")) {
        showCustomModal("لطفاً یک فایل JSON معتبر انتخاب کنید.", "error");
        return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const importedNotes = JSON.parse(e.target.result);
            if (!Array.isArray(importedNotes)) {
                throw new Error("فایل JSON باید یک آرایه باشد.");
            }
            const validNotes = importedNotes.every(note => 
                typeof note === "object" &&
                "title" in note &&
                "content" in note &&
                "lastEdited" in note
            );
            if (!validNotes) {
                throw new Error("ساختار یادداشت‌ها در فایل JSON معتبر نیست.");
            }
            notes = [...notes, ...importedNotes];
            saveNotes();
            renderNotes();
            showCustomModal("یادداشت‌ها با موفقیت وارد شدند.", "success");
        } catch (error) {
            showCustomModal("خطا در وارد کردن یادداشت‌ها: " + error.message, "error");
        }
        importFileInput.value = "";
    };
    reader.readAsText(file);
});

renderNotes();
loadNote();

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker
            .register("service-worker.js")
            .then((registration) => {
                console.log("Service Worker registered:", registration);
            })
            .catch((error) => {
                console.error("Service Worker registration failed:", error);
            });
    });
}

setInterval(() => {
    if (currentNoteIndex !== -1) {
        notes[currentNoteIndex].title = noteTitle.value;
        notes[currentNoteIndex].content = noteContent.innerHTML;
        notes[currentNoteIndex].lastEdited = new Date().getTime();
        localStorage.setItem("notes", JSON.stringify(notes));
    }
}, 2000);
