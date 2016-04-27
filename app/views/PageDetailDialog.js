function PageDetailDialog() {
    Dialog.call(this);
    this.modified = false;
    this.title = "CREATE NEW PAGE";
    this.pageCombo.renderer = function (canvas) {
        return canvas.name;
    };
    this.pageCombo.decorator = function (node, canvas) {
    };

    this.pageSizeCombo.renderer = function (pageSize) {
        if (!pageSize.value) return pageSize.displayName;
        return pageSize.displayName + " (" + pageSize.value + ")";
    }

    this.backgroundCombo.renderer = function (background) {
        return background.displayName;
    };

    var thiz = this;
    this.pageCombo.addEventListener("p:ItemSelected", function (event) {
        thiz.modified = true;
    }, false);

    this.pageSizeCombo.addEventListener("p:ItemSelected", function (event) {
        var pageSize = thiz.pageSizeCombo.getSelectedItem();
        thiz.widthInput.disabled = pageSize.value;
        thiz.heightInput.disabled = pageSize.value;
        if (pageSize.value) {
            thiz.setPageSizeValue(pageSize.value);
        }

        thiz.modified = true;
    }, false);

    this.backgroundCombo.addEventListener("p:ItemSelected", function (event) {
        var background = thiz.backgroundCombo.getSelectedItem();
        thiz.colorButton.disabled = background.value ? true : false;
        thiz.modified = true;
    }, false);

    this.colorButton.addEventListener("click", function (event) {
        var color = thiz.colorButton.style.color ? Color.fromString(thiz.colorButton.style.color) : Color.fromString("#FFFFFF");
        thiz.selector.setColor(color);
        thiz.selectorContainer.show(thiz.colorButton, "left-inside", "bottom", 0, 5);
        event.cancelBubble = true;
    }, false);

    this.selector.addEventListener("ValueChange", function (event) {
        var color = thiz.selector.getColor();
        //thiz.colorButton.bgColor = color;
        thiz.colorButton.style.color = color.toRGBString();
        thiz.modified = true;
    }, false);

    this.pageTitle.addEventListener("change", function (event) {
        thiz.modified = true;
    }, false);
}

__extend(Dialog, PageDetailDialog);

Page.defaultPageSizes = [
    {
        value: "800x600",
        displayName: "Compact Web page"
    },
    {
        value: "960x600",
        displayName: "960 Web page"
    },
    {
        value: "960x900",
        displayName: "960 Web page - long"
    },
    {
        value: "1024x768",
        displayName: "Normal Web page"
    },
    {
        value: "1280x800",
        displayName: "Large Web page"
    },
    {
        value: "774x1052",
        displayName: "A4 at 90dpi"
    },
    {
        value: "2480x3508",
        displayName: "A4 at 90dpi"
    }
];


PageDetailDialog.prototype.setPageSizeValue = function (value) {
    var index = value.indexOf("x");
    if (index > -1) {
        this.widthInput.value = value.substring(0, index);
        this.heightInput.value = value.substring(index + 1);
    }
}

var createComboitems = function (pages, onDone, padding){
    padding += 1;
    for(var i = 0; i < pages.length; i++) {
        onDone(pages[i], padding);
        if (pages[i].children) {
            createComboitems(pages[i].children, onDone, padding);
        }
    }
}

PageDetailDialog.prototype.setup = function (options) {
    var thiz = this;
    this.options = options;
    this.originalPage = options.defaultPage;
    this.isCreatePage = !this.originalPage;
    this.modified = false;

    if (this.options && this.options.onDone) this.onDone = this.options.onDone;
    var pagesComboItems = [];
    pagesComboItems.push({
        name: "(None)"
    });
    var pages = Pencil.controller.doc.pages;

    // Create combobox item for parent of Page
    var hideParentPageItem = [];
    if(this.originalPage) {
        hideParentPageItem.push(this.originalPage);
    }
    var conditionChildOf = function(page, padding) {
        if(page != thiz.originalPage) {
            var check = false;
            if (page.parentPage) {
                var index = hideParentPageItem.indexOf(page.parentPage);
                if(index >= 0 ) {
                    hideParentPageItem.push(page);
                    check =true;
                }
            }
            if (!check) {
                page.padding = padding
                pagesComboItems.push(page);
            }
        }
    }
    for(var i in pages) {
        if (!pages[i].parentPage ) {
            conditionChildOf(pages[i], null);
            if (pages[i].children) {
                createComboitems(pages[i].children, conditionChildOf, 0);
            }
        }
    }
    this.pageCombo.setItems(pagesComboItems);

    if (this.options && this.options.defaultParentPage) {
        this.pageCombo.selectItem(this.options.defaultParentPage);
    }

    var pageSizes = [];

    var lastSize = Config.get("lastSize");
    if (lastSize) {
        pageSizes.push({
            displayName: "Last used",
            value: lastSize
        });
    }

    var bestFitSize = Pencil.controller.getBestFitSize();
    if (bestFitSize) {
        pageSizes.push({
            displayName: "Best fit",
            value: bestFitSize
        });
    }

    pageSizes.push({
        displayName: "Custome size..."
    });

    pageSizes = pageSizes.concat(Page.defaultPageSizes);
    this.pageSizeCombo.setItems(pageSizes);

    var backgroundItems = [
        {
            displayName: "Transparent Background",
            value: "transparent"
        },
        {
            displayName: "Background Color"
        }
    ];


    //Create combobox item for background Page
    var backgroundPageItem =[];
    if (this.originalPage) {
        backgroundPageItem.push(this.originalPage.id);
    }
    var conditionBackground = function(page, padding) {
        if(page != thiz.originalPage) {
            var check = false;
            if (page.backgroundPageId) {
                var index = backgroundPageItem.indexOf(page.backgroundPageId);
                if(index >= 0 ) {
                    backgroundPageItem.push(page.id);
                    check =true;
                }
            }
            if (!check) {
                backgroundItems.push({
                    displayName: page.name,
                    value: page.id,
                    padding: padding
                });
            }
        }
    }
    for(var i in pages) {
        if (!pages[i].parentPage ) {
            if(pages[i] != thiz.originalPage) {
                 conditionBackground(pages[i], null);
            }
            if (pages[i].children) {
                createComboitems(pages[i].children, conditionBackground, 0);
            }
        }
    }

    this.backgroundCombo.setItems(backgroundItems);

    var pageSize = this.pageSizeCombo.getSelectedItem();
    this.widthInput.disabled = pageSize.value;
    this.heightInput.disabled = pageSize.value;

    if(this.originalPage) {
        this.setPageItem(this.originalPage);
    }
    var background = thiz.backgroundCombo.getSelectedItem();
    thiz.colorButton.disabled = background.value ? true : false;
};

PageDetailDialog.prototype.setPageItem = function (page) {
    if(page.parentPage) {
        this.pageCombo.selectItem(page.parentPage);
    }
    this.pageTitle.value = page.name;

    var pageSizeValue = page.width + "x" + page.height;
    var index;
    for (var i in this.pageSizeCombo.items ) {
        if(this.pageSizeCombo.items[i].value == pageSizeValue) {
            index = this.pageSizeCombo.items[i];
        }
    }
    var thiz = this;
    if(index != null) {
        this.pageSizeCombo.selectItem(index);
        this.setPageSizeValue(index.value);
    } else {
        this.pageSizeCombo.selectItem({
            displayName: "Custome size..."
        });
        this.widthInput.disabled = false;
        this.heightInput.disabled = false;
        this.widthInput.value = page.width;
        this.heightInput.value = page.height;
        this.widthInput.addEventListener("change", function () {
            thiz.modified = true;
        }, false);
        this.heightInput.addEventListener("change", function () {
            thiz.modified = true;
        }, false);
    }

    if(page.backgroundColor) {
        this.backgroundCombo.selectItem({
             displayName: "Background Color"
        });
        this.colorButton.style.color = page.backgroundColor ? page.backgroundColor.toRGBString() : "#000" ;
    }
    if (page.backgroundPage) {
        this.backgroundCombo.selectItem({
             displayName: page.backgroundPage.name,
             value: page.backgroundPage.id
        });
        this.colorButton.style.color = page.backgroundPage.backgroundColor ? page.backgroundPage.backgroundColor.toRGBString() : "#000";
    }

    if (!page.backgroundPageId && !page.backgroundColor) {
        this.backgroundCombo.selectItem({
            displayName: "Transparent Background",
            value: "transparent"
        });
        this.colorButton.disabled = true;
    }
}

const SIZE_RE = /^([0-9]+)x([0-9]+)$/;

PageDetailDialog.prototype.createPage = function () {
    var name = this.pageTitle.value;

    var width = 0;
    var height = 0;
    var pageSize = this.pageSizeCombo.getSelectedItem();
    if (pageSize.value) {
        var size = pageSize.value;
        if (size.match(SIZE_RE)) {
            width = parseInt(RegExp.$1, 10);
            height = parseInt(RegExp.$2, 10);
        }
    } else {
        width = parseInt(this.widthInput.value, 10);
        height = parseInt(this.heightInput.value, 10);
    }

    var backgroundPageId = null;
    var backgroundColor = null;

    var background = this.backgroundCombo.getSelectedItem();
    if (background.value != "transparent") {
        if (typeof(background.value) == "undefined") {
            backgroundColor = this.colorButton.style.color ? Color.fromString(this.colorButton.style.color) : Color.fromString("#FFFFFF");
        } else {
            backgroundPageId = background.value;
        }
    }

    var page = Pencil.controller.newPage(name, width, height, backgroundPageId, backgroundColor, "", this.pageCombo.getSelectedItem().id);

    Config.set("lastSize", [width, height].join("x"));
    return page;
};

PageDetailDialog.prototype.updatePage = function() {
    var page = this.originalPage;

    var name = this.pageTitle.value;

    var width = parseInt(this.widthInput.value, 10);
    var height = parseInt(this.heightInput.value, 10);
    Config.set("lastSize", [page.width, page.height].join("x"));

    var thiz = this;
    var background = thiz.backgroundCombo.getSelectedItem();
    var backgroundColor = null;
    var backgroundPageId = null;

    if (background.value != "transparent") {
        if (typeof(background.value) == "undefined") {
            backgroundColor = this.colorButton.style.color ? Color.fromString(this.colorButton.style.color) : Color.fromString("#FFFFFF");
        } else {
            backgroundPageId = background.value;
        }
    } else if (background.value == "transparent") {
        backgroundPageId = null;
        backgroundColor = null;
    }
    var parentPageId = this.pageCombo.getSelectedItem().id;
    Pencil.controller.updatePageProperties(page, name, backgroundColor, backgroundPageId, parentPageId, width, height);
    return page;
}
PageDetailDialog.prototype.getDialogActions = function () {
    var thiz = this;

    return [
        {   type: "cancel", title: "Cancel",
            run: function () {
                if(this.modified) {
                    if(this.pageTitle.value == "" ) {
                        Dialog.alert("The page name is invalid. Please enter the valid page name.");
                        return;
                    }
                    Dialog.confirm(
                        "Do you want to save your changes before closing?", null,
                        "Save", function () {
                            if (thiz.isCreatePage) {
                                var page = thiz.createPage();
                                if (thiz.onDone) thiz.onDone(page);
                            } else {
                                var page = thiz.updatePage();
                                if (thiz.onDone) thiz.onDone(page);
                            }
                        },
                        "Cancel"
                    );
                }
                return true;
            }
        },
        {
            type: "accept", title: "APPLY",
            run: function () {
                if(this.pageTitle.value == "" ) {
                    Dialog.alert("The page name is invalid. Please enter the valid page name.");
                    return;
                }
                if (thiz.isCreatePage) {
                    var page = thiz.createPage();
                    if (thiz.onDone) thiz.onDone(page);
                } else {
                    if (this.modified) {
                        var page = thiz.updatePage();
                        if (thiz.onDone) thiz.onDone(page);
                    }
                }

                return true;
            }
        }
    ];
};
