const textHeaderRegex = /<p>#([a-zA-Z0-9-]*)\((.*)\)<\/p>/g;
const tooltipRegex = /(<code.*>*?[^]<\/code>)|°(.*)°\((.*)\)/g;

const codeTabRegex = /(?:<p>={3}group<\/p>\n)((?:<pre><code class=".+">[^]*?<\/code><\/pre>\n){2,})(?:<p>={3}<\/p>)/g;
const langCodeRegex = /<code class="(.+)">/;

const colorRegex = /(<code.*>*?[^]<\/code>)|%\((#[\dA-Fa-f]{6}|rgb\(\d{1,3}, ?\d{1,3}, ?\d{1,3}\)|[a-z]+)\)\[(.+?)]/g;

const paragraphAndHeadingRegex = /<(h[1-6]|p)>([^]*?)<\/(?:h[1-6]|p)>/g;
const noteRegex = /<p>!!! (note|warning|attention|important): ((.|<br \/>\n)*)<\/p>/g;

const noteIcons = {
    note: 'fa-info-circle',
    warning: 'fa-exclamation-triangle',
    attention: 'fa-exclamation-triangle',
    important: 'fa-exclamation-circle'
};

const ExtendedMarkdown = {
    // post
    parsePost: function (data, callback) {
        if (data && data.postData && data.postData.content) {
            data.postData.content = applyExtendedMarkdown(data.postData.content);
            data.postData.content = applyGroupCode(data.postData.content, data.postData.pid)
        }
        callback(null, data);
    },
    // user signature
    parseSignature: function (data, callback) {
        if (data && data.userData && data.userData.signature) {
            data.userData.signature = applyExtendedMarkdown(data.userData.signature);
        }
        callback(null, data);
    },
    // user description
    parseAboutMe: function (data, callback) {
        if (data) {
            data = applyExtendedMarkdown(data);
        }
        callback(null, data);
    },
    // direct preview in editor
    parseRaw: function (data, callback) {
        if (data) {
            data = applyExtendedMarkdown(data);
            data = applyGroupCode(data, "")
        }
        callback(null, data);
    },
    registerFormating: function (payload, callback) {
        const formating = [
            {name: "color", className: "fa fa-eyedropper", title: "[[extendedmarkdown:composer.formatting.color]]"},
            {name: "left", className: "fa fa-align-left", title: "[[extendedmarkdown:composer.formatting.left]]"},
            {name: "center", className: "fa fa-align-center", title: "[[extendedmarkdown:composer.formatting.center]]"},
            {name: "right", className: "fa fa-align-right", title: "[[extendedmarkdown:composer.formatting.right]]"},
            {name: "justify", className: "fa fa-align-justify", title: "[[extendedmarkdown:composer.formatting.justify]]"},
            {name: "code", className: "fa fa-code", title: "[[extendedmarkdown:composer.formatting.code]]"},
            {name: "textheader", className: "fa fa-header", title: "[[extendedmarkdown:composer.formatting.textheader]]"},
            {name: "groupedcode", className: "fa fa-file-code-o", title: "[[extendedmarkdown:composer.formatting.groupedcode]]"},
            {name: "bubbleinfo", className: "fa fa-info-circle", title: "[[extendedmarkdown:composer.formatting.bubbleinfo]]"}
        ];

        payload.options = payload.options.concat(formating);

        callback(null, payload);
    }
};

function applyExtendedMarkdown(textContent) {
    if (textContent.match(noteRegex)) {
        textContent = textContent.replace(noteRegex, function (match, type, text) {
            return `<div class="admonition `+type.toLowerCase()+`"><p class="admonition-title"><i class="fa `+noteIcons[type.toLowerCase()]+`"></i>`+type.charAt(0).toUpperCase() + type.slice(1)+`</p><p>`+text+`</p></div>`;
        });
    }

    if (textContent.match(textHeaderRegex)) {
        textContent = textContent.replace(textHeaderRegex, function (match, anchorId, text) {
            return '<h2 class="text-header"><a class="anchor-offset" name="'+anchorId+'"></a>' + text + '</h2>';
        });
    }
    if (textContent.match(tooltipRegex)) {
        textContent = textContent.replace(tooltipRegex, function (match, code, text, tooltipText) {
            if(typeof(code) !== "undefined") {
                return code;
            }
            else if ("fa-info" === text) {
                return '<i class="fa fa-info-circle extended-markdown-tooltip" data-toggle="tooltip" title="' + tooltipText + '"></i>';
            }
            else {
                return '<span class="extended-markdown-tooltip" data-toggle="tooltip" title="' + tooltipText + '">' + text + '</span>';
            }
        });
    }
    if (textContent.match(colorRegex)) {
        textContent = textContent.replace(colorRegex, function (match, code, color, text) {
            if(typeof(code) !== "undefined") {
                return code;
            }
            return `<span style="color: ${color};">${text}</span>`;
        });
    }

    if (textContent.match(paragraphAndHeadingRegex)) {
        textContent = textContent.replace(paragraphAndHeadingRegex, function (match, tag, text) {
            let hasStartPattern = text.startsWith("|-");
            let hasEndPattern = text.endsWith("-|");
            let anchor = tag.charAt(0) == "h" ? generateAnchorFromHeading(text) : "";
            if(text.startsWith("|=") && text.endsWith("=|")) {
                return `<${tag} style="text-align:justify;">${anchor}${text.slice(2).slice(0, -2)}</${tag}>`;
            }
            else if(hasStartPattern && hasEndPattern) {
                return `<${tag} style="text-align:center;">${anchor}${text.slice(2).slice(0, -2)}</${tag}>`;
            }
            else if(hasEndPattern) {
                return `<${tag} style="text-align:right;">${anchor}${text.slice(0, -2)}</${tag}>`;
            }
            else if(hasStartPattern) {
                return `<${tag} style="text-align:left;">${anchor}${text.slice(2)}</${tag}>`;
            }
            return `<${tag}>${anchor}${text}</${tag}>`;
        });
    }

    return textContent;
}

function applyGroupCode(textContent, id) {
    if (textContent.match(codeTabRegex)) {
        let codeArray = codeTabRegex.exec(textContent);
        codeArray = codeArray[1].split(/<\/pre>\n<pre>/g);
        let lang = [];
        lang[0] = langCodeRegex.exec(codeArray[0])[1];
        codeArray[0] += "</pre>\n";
        for (let i = 1; i < codeArray.length - 1; i++) {
            lang[i] = langCodeRegex.exec(codeArray[i])[1];
            codeArray[i] = "<pre>" + codeArray[i] + "</pre>\n";
        }
        codeArray[codeArray.length - 1] = "<pre>" + codeArray[codeArray.length - 1];
        lang[codeArray.length - 1] = langCodeRegex.exec(codeArray[codeArray.length - 1])[1];
        let count = 0;
        textContent = textContent.replace(codeTabRegex, () => {
            let menuTab = "<ul class='nav nav-tabs' role='tablist'>";
            let contentTab = "<div class='tab-content'>";
            for (let i = 0; i < lang.length; i++) {
                menuTab += `<li role='presentation' ${i === 0 ? "class='active'" : ""}><a href='#${lang[i] + count + id}' aria-controls='${lang[i]}' role='tab' data-toggle='tab'>${capitalizeFirstLetter(lang[i])}</a></li>`;
                contentTab += `<div role="tabpanel" class="tab-pane ${i === 0 ? "active" : ""}" id="${lang[i] + count + id}">${codeArray[i]}</div>`;
            }
            menuTab += "</ul>";
            contentTab += "</div>";
            count++;
            return menuTab + contentTab;
        });
    }
    return textContent;
}

function capitalizeFirstLetter(name) {
    return name.charAt(0).toUpperCase() + name.slice(1);
}

function generateAnchorFromHeading(heading) {
    return `<a class="anchor-offset" name="${heading.toLowerCase().replace(/\s/g, "-").replace(/(<([^>]+)>)|[^\w\s\-]/ig, "")}"></a>`;
}

module.exports = ExtendedMarkdown;
