const $ = document;
const body = $.body;
const themeBtn = $.getElementById("theme-btn");
const newNoteBtn = $.getElementById("new-note");
const noteList = $.getElementById("note-list");
const todoBtn = $.getElementById("todo-btn");
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
const codeBlockBtn = $.getElementById("code-block-btn");
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

let notes = JSON.parse(localStorage.getItem("notes")) || [];
let currentNoteIndex = -1;

// تابع نمایش Modal
function showCustomModal(message, type = "success", onConfirm = null) {
    modalMessage.textContent = message;
    modalIcon.className = "modal-icon";
    modalCloseBtn.style.display = type === "confirm" || type === "form" ? "none" : "inline-block";
    modalConfirmBtn.style.display = type === "confirm" || type === "form" ? "inline-block" : "none";
    modalCancelBtn.style.display = type === "confirm" || type === "form" ? "inline-block" : "none";
    modalForm.style.display = type === "form" ? "block" : "none";

    if (type === "success") {
        modalIcon.classList.add("success");
    } else if (type === "error") {
        modalIcon.classList.add("error");
    } else if (type === "confirm" || type === "form") {
        modalIcon.classList.add("question");
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
$.addEventListener("keydown", (event) => {
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
        const li = $.createElement("li");
        li.style.setProperty('--index', index); // برای انیمیشن‌های تأخیری
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
        const noteText = $.createElement("span");
        noteText.innerHTML = `<b>${note.title || "یادداشت بدون عنوان"}</b>`;
        const notePreview = $.createElement("p");
        notePreview.className = "note-preview";
        notePreview.innerHTML = preview;
        const deleteButton = $.createElement("button");
        deleteButton.className = "delete-note";
        deleteButton.dataset.index = index;
        deleteButton.textContent = "×";
        deleteButton.addEventListener("click", (event) => {
            event.stopPropagation();
            const indexToDelete = parseInt(event.target.dataset.index);
            const originalIndex = notes.indexOf(sortedNotes[indexToDelete]);
            showCustomModal(
                "آیا مطمئن به حذف این یادداشت هستید؟",
                "confirm",
                () => {
                    notes.splice(originalIndex, 1);
                    if (currentNoteIndex === originalIndex) {
                        currentNoteIndex = -1;
                        loadNote();
                    } else if (currentNoteIndex > originalIndex) {
                        currentNoteIndex--;
                    }
                    saveNotes();
                }
            );
        });
        const pinButton = $.createElement("button");
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
            li.classList.add("selected");
            setTimeout(() => li.classList.remove("selected"), 300);
        });
        noteList.appendChild(li);
    });
}

function insertHtmlAtCursor(html) {
    let range, selection;
    if ($.createRange) {
        selection = window.getSelection();
        noteContent.focus();
        selection.removeAllRanges();
        range = $.createRange();
        range.selectNodeContents(noteContent);
        range.collapse(false);
        selection.addRange(range);

        if (selection.getRangeAt && selection.rangeCount) {
            range = selection.getRangeAt(0);
            range.deleteContents();
            let tempDiv = $.createElement("div");
            tempDiv.innerHTML = html;
            let fragment = $.create$Fragment();
            let node;
            while ((node = tempDiv.firstChild)) {
                fragment.appendChild(node);
            }
            range.insertNode(fragment);
        }
    } else if ($.selection && $.selection.createRange) {
        $.selection.createRange().pasteHTML(html);
    }
}

function loadNote() {
    if (currentNoteIndex !== -1) {
        noteTitle.value = notes[currentNoteIndex].title;
        noteContent.innerHTML = notes[currentNoteIndex].content;
        noteContent.classList.add("fade-in");
        setTimeout(() => noteContent.classList.remove("fade-in"), 300);
    } else {
        noteTitle.value = "";
        noteContent.innerHTML = "";
    }
}

function surroundSelection(tag) {
    $.execCommand(tag, false, null);
}

boldBtn.addEventListener("click", () => surroundSelection("bold"));
italicBtn.addEventListener("click", () => surroundSelection("italic"));
underlineBtn.addEventListener("click", () => surroundSelection("underline"));
insertUnorderedListBtn.addEventListener("click", () => surroundSelection("insertUnorderedList"));
insertOrderedListBtn.addEventListener("click", () => surroundSelection("insertOrderedList"));

$.addEventListener("keydown", (event) => {
    if (event.ctrlKey && event.shiftKey && event.key === "C") {
        $.execCommand("formatBlock", false, "pre");
    }
});

codeBlockBtn.addEventListener("click", () => {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    const range = selection.getRangeAt(0);
    const selectedText = range.toString();
    if (selectedText) {
        const pre = $.createElement("pre");
        pre.textContent = selectedText;
        pre.classList.add("fade-in");
        range.deleteContents();
        range.insertNode(pre);
        setTimeout(() => pre.classList.remove("fade-in"), 300);
        saveNotes();
    } else {
        const pre = $.createElement("pre");
        pre.classList.add("fade-in");
        noteContent.appendChild(pre);
        pre.focus();
        setTimeout(() => pre.classList.remove("fade-in"), 300);
        saveNotes();
    }
});

rtlLtrBtn.addEventListener("click", () => {
    noteContent.style.direction =
        noteContent.style.direction === "rtl" ? "ltr" : "rtl";
    noteContent.classList.add("fade-in");
    setTimeout(() => noteContent.classList.remove("fade-in"), 300);
    saveNotes();
});

newNoteBtn.addEventListener("click", () => {
    if (currentNoteIndex !== -1) {
        notes[currentNoteIndex].title = noteTitle.value;
        notes[currentNoteIndex].content = noteContent.innerHTML;
        notes[currentNoteIndex].lastEdited = new Date().getTime();
    }
    notes.push({ title: "", content: "", lastEdited: new Date().getTime(), pinned: false });
    currentNoteIndex = notes.length - 1;
    localStorage.setItem("notes", JSON.stringify(notes));
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
                showCustomModal("لطفاً اعداد صحیح و بزرگتر از صفر وارد کنید.", "error");
                return;
            }
            let tableHTML = "<table style='width: 100%; border-collapse: separate; border-spacing: 0;'>";
            for (let i = 0; i < rows; i++) {
                tableHTML += "<tr>";
                for (let j = 0; j < cols; j++) {
                    if (i === 0) {
                        tableHTML += `<th style='border: 1px solid #ddd; padding: 10px; text-align: center;'>سربرگ ${j + 1}</th>`;
                    } else {
                        tableHTML += "<td style='border: 1px solid #ddd; padding: 10px; text-align: center;'></td>";
                    }
                }
                tableHTML += "</tr>";
            }
            tableHTML += "</table>";
            insertHtmlAtCursor(tableHTML);
            saveNotes();
        }
    );
    tableRowsInput.value = "3";
    tableColsInput.value = "3";
});

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

$.addEventListener("keydown", (event) => {
    if (event.key === "Delete") {
        const row = getSelectedRow();
        if (row) {
            const table = row.parentElement.parentElement;
            if (table.rows.length > 1) {
                row.classList.add("fade-out");
                setTimeout(() => {
                    row.remove();
                    saveNotes();
                }, 300);
            } else {
                showCustomModal("نمی‌توانید آخرین سطر جدول را حذف کنید.", "error");
            }
        }
    }
});

addRowBtn.addEventListener("click", () => {
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
        newCell.style.border = "1px solid #ddd";
        newCell.style.padding = "10px";
        newCell.style.textAlign = "center";
        newCell.textContent = "";
    }
    setTimeout(() => newRow.classList.remove("fade-in"), 300);
    saveNotes();
});

addColumnBtn.addEventListener("click", () => {
    const table = getSelectedTable();
    if (!table) {
        showCustomModal("لطفاً ابتدا روی یک جدول کلیک کنید.", "error");
        return;
    }
    const rowCount = table.rows.length;
    for (let i = 0; i < rowCount; i++) {
        const newCell = table.rows[i].insertCell(-1);
        newCell.classList.add("fade-in");
        newCell.style.border = "1px solid #ddd";
        newCell.style.padding = "10px";
        newCell.style.textAlign = "center";
        if (i === 0) {
            newCell.outerHTML = `<th style='border: 1px solid #ddd; padding: 10px; text-align: center;'>سربرگ ${table.rows[0].cells.length}</th>`;
        } else {
            newCell.textContent = "";
        }
        setTimeout(() => newCell.classList.remove("fade-in"), 300);
    }
    saveNotes();
});

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

colorBtn.addEventListener("click", () => {
    colorPicker.click();
});

colorPicker.addEventListener("change", (event) => {
    const selectedColor = event.target.value;
    const selection = window.getSelection();
    if (selection.rangeCount) {
        const range = selection.getRangeAt(0);
        const selectedText = range.extractContents();
        const span = $.createElement("span");
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
        const span = $.createElement("span");
        span.style.fontSize = selectedFontSize;
        span.classList.add("fade-in");
        span.appendChild(range.extractContents());
        range.insertNode(span);
        setTimeout(() => span.classList.remove("fade-in"), 300);
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
    const todoSpan = $.createElement("span");
    todoSpan.classList.add("todo-item");
    todoSpan.innerHTML = '<span class="todo-checkbox"></span> ';
    todoSpan.classList.add("fade-in");
    range.insertNode(todoSpan);
    setTimeout(() => todoSpan.classList.remove("fade-in"), 300);
    saveNotes();
});

saveNoteBtn.addEventListener("click", () => {
    if (currentNoteIndex !== -1) {
        notes[currentNoteIndex].title = noteTitle.value;
        notes[currentNoteIndex].content = noteContent.innerHTML;
        notes[currentNoteIndex].lastEdited = new Date().getTime();
        localStorage.setItem("notes", JSON.stringify(notes));
        renderNotes();
        showCustomModal("یادداشت ذخیره شد", "success");
    } else {
        showCustomModal("لطفا ابتدا یک یادداشت جدید ایجاد کنید", "error");
    }
});

toggleSidebarBtn.addEventListener("click", () => {
    sidebar.classList.toggle("hidden");
    toggleSidebarBtn.textContent = sidebar.classList.contains("hidden") ? "←" : "→";
    noteEditor.style.width = sidebar.classList.contains("hidden") ? "100%" : "calc(100% - 250px)";
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
        const img = $.createElement("img");
        img.src = e.target.result;
        img.style.maxWidth = "100%";
        img.style.maxHeight = "100%";
        img.classList.add("fade-in");
        noteContent.appendChild(img);
        setTimeout(() => img.classList.remove("fade-in"), 300);
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
        const hr = $.createElement("hr");
        hr.classList.add("fade-in");
        if (!selection.isCollapsed) {
            range.deleteContents();
        }
        range.insertNode(hr);
        const br = $.createElement("br");
        range.insertNode(br);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
        setTimeout(() => hr.classList.remove("fade-in"), 300);
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
    const link = $.createElement("a");
    link.href = url;
    link.download = "notes-backup.json";
    $.body.appendChild(link);
    link.click();
    $.body.removeChild(link);
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

// افزودن انیمیشن fade-in عمومی
const style = $.createElement("style");
style.textContent = `
    .fade-in {
        animation: fadeIn 0.3s ease;
    }
    .fade-out {
        animation: fadeOut 0.3s ease;
    }
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
    .theme-transition {
        transition: background-color 0.5s ease, color 0.5s ease;
    }
    #note-list li.selected {
        background-color: rgba(74, 144, 226, 0.1);
        transition: background-color 0.3s ease;
    }
`;
$.head.appendChild(style);

renderNotes();
loadNote();

setInterval(() => {
    if (currentNoteIndex !== -1) {
        notes[currentNoteIndex].title = noteTitle.value;
        notes[currentNoteIndex].content = noteContent.innerHTML;
        notes[currentNoteIndex].lastEdited = new Date().getTime();
        localStorage.setItem("notes", JSON.stringify(notes));
    }
}, 2000);

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
