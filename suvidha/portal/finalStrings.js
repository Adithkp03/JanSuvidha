const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'src', 'locales');

const additions = {
    en: {
        "ReviewApplication": "Review Application",
        "BackToDetails": "Back to Details",
        "FormDetails": "Form Details",
        "UploadDocs": "Upload Docs",
        "Review": "Review"
    },
    hi: {
        "ReviewApplication": "आवेदन की समीक्षा करें",
        "BackToDetails": "विवरण पर वापस जाएं",
        "FormDetails": "फॉर्म विवरण",
        "UploadDocs": "दस्तावेज़ अपलोड करें",
        "Review": "समीक्षा"
    },
    ml: {
        "ReviewApplication": "അപേക്ഷ അവലോകനം ചെയ്യുക",
        "BackToDetails": "വിവരങ്ങളിലേക്ക് മടങ്ങുക",
        "FormDetails": "ഫോം വിവരങ്ങൾ",
        "UploadDocs": "രേഖകൾ അപ്‌ലോഡ് ചെയ്യുക",
        "Review": "അവലോകനം"
    },
    mr: {
        "ReviewApplication": "अर्जाचे पुनरावलोकन करा",
        "BackToDetails": "तपशीलांवर परत जा",
        "FormDetails": "फॉर्म तपशील",
        "UploadDocs": "कागदपत्रे अपलोड करा",
        "Review": "पुनरावलोकन"
    },
    te: {
        "ReviewApplication": "దరఖాస్తును సమీక్షించండి",
        "BackToDetails": "వివరాలకు తిరిగి వెళ్లండి",
        "FormDetails": "ఫారమ్ వివరాలు",
        "UploadDocs": "పత్రాలను అప్‌లోడ్ చేయండి",
        "Review": "సమీక్ష"
    }
};

for (const [lang, extraKeys] of Object.entries(additions)) {
    const filePath = path.join(localesDir, `${lang}.json`);
    let data = {};
    if (fs.existsSync(filePath)) {
        data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
    const merged = { ...data, ...extraKeys };
    fs.writeFileSync(filePath, JSON.stringify(merged, null, 2));
    console.log(`Updated ${lang}.json with final Strings`);
}
