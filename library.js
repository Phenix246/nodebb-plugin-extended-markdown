const textHeaderRegex = /#([a-zA-Z]*)\((.*)\)/g;
// small hack for compatibility with nodebb-plugin-markdown (remove <p> </p> added by it)
const textHeaderRegexP = /<p>#([a-zA-Z]*)\((.*)\)<\/p>/g;
const tooltipRegex = /°(.*)°\((.*)\)/g;

const codeTabRegex = /(?:<p>={3}group<\/p>\n)((?:<pre><code class=".+">[^]*<\/code><\/pre>\n){2,})(?:<p>={3}<\/p>)/;
const langCodeRegex = /<code class="(.+)">/;

const MFFCustomBB = {
    // post
    parsePost: function (data, callback) {
        if (data && data.postData && data.postData.content) {
            data.postData.content = applyMFFCustomBB(data.postData.content);
        }
        callback(null, data);
    },
    // user signature
    parseSignature: function (data, callback) {
        if (data && data.userData && data.userData.signature) {
            data.userData.signature = applyMFFCustomBB(data.userData.signature);
        }
        callback(null, data);
    },
    // user description
    parseAboutMe: function (data, callback) {
        if (data) {
            data = applyMFFCustomBB(data);
        }
        callback(null, data);
    },
    // direct preview in editor
    parseRaw: function (data, callback) {
        if (data) {
            data = applyMFFCustomBB(data);
        }
        callback(null, data);
    }
};

function applyMFFCustomBB(textContent) {
    if (textContent.match(textHeaderRegexP)) {
        textContent = textContent.replace(textHeaderRegexP, function (match, anchorId, text) {
            return '<h2 class="text-header" id="' + anchorId + '">' + text + '</h2>';
        });
    }
    if (textContent.match(textHeaderRegex)) {
        textContent = textContent.replace(textHeaderRegex, function (match, anchorId, text) {
            return '<h2 class="text-header" id="' + anchorId + '">' + text + '</h2>';
        });
    }
    if (textContent.match(tooltipRegex)) {
        textContent = textContent.replace(tooltipRegex, function (match, text, tooltipText) {
            if ("fa-info" === text) {
                return '<i class="fa fa-info-circle mff-tooltip" data-toggle="tooltip" title="' + tooltipText + '"></i>';
            }
            else {
                return '<span class="mff-tooltip" data-toggle="tooltip" title="' + tooltipText + '">' + text + '</span>';
            }
        });
    }
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
        textContent = textContent.replace(codeTabRegex, () => {
            let menuTab = "<ul class='nav nav-tabs' role='tablist'>";
            let contentTab = "<div class='tab-content'>";
            for (let i = 0; i < lang.length; i++) {
                menuTab += `<li role='presentation' ${i === 0 ? "class='active'" : ""}><a href='#${lang[i]}' aria-controls='${lang[i]}' role='tab' data-toggle='tab'>${capitalizeFirstLetter(lang[i])}</a></li>`;
                contentTab += `<div role="tabpanel" class="tab-pane ${i === 0 ? "active" : ""}" id="${lang[i]}">${codeArray[i]}</div>`;
            }
            menuTab += "</ul>";
            contentTab += "</div>";
            return menuTab + contentTab;
        });
    }
    return textContent;
}

function capitalizeFirstLetter(name) {
    return name.charAt(0).toUpperCase() + name.slice(1);
}

module.exports = MFFCustomBB;
