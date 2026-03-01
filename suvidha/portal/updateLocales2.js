const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'src', 'locales');

const additions = {
    en: {
        "ApplicantDetails": "Applicant Details",
        "AttachedFiles": "Attached Files",
        "EditBtn": "Edit",
        "ApplicationSummary": "Application Summary",
        "VerifyInfoDesc": "Verify your information before finalizing the submission.",
        "ProvideDocs": "Provide Documentation",
        "TermsAndConditions": "By submitting, you agree to the terms and conditions.",
        "SubmitSecurely": "Submit Securely",
        "SubmittingProtocol": "Submitting Protocol..."
    },
    hi: {
        "ApplicantDetails": "आवेदक का विवरण",
        "AttachedFiles": "संलग्न फ़ाइलें",
        "EditBtn": "संपादित करें",
        "ApplicationSummary": "आवेदन सारांश",
        "VerifyInfoDesc": "सबमिशन को अंतिम रूप देने से पहले अपनी जानकारी सत्यापित करें।",
        "ProvideDocs": "दस्तावेज़ प्रदान करें",
        "TermsAndConditions": "सबमिट करके, आप नियमों और शर्तों से सहमत होते हैं।",
        "SubmitSecurely": "सुरक्षित रूप से सबमिट करें",
        "SubmittingProtocol": "सबमिट कर रहा है..."
    },
    ml: {
        "ApplicantDetails": "അപേക്ഷകന്റെ വിവരങ്ങൾ",
        "AttachedFiles": "അറ്റാച്ചുചെയ്ത ഫയലുകൾ",
        "EditBtn": "തിരുത്തുക",
        "ApplicationSummary": "അപേക്ഷാ സംഗ്രഹം",
        "VerifyInfoDesc": "സമർപ്പിക്കുന്നതിന് മുമ്പ് വിവരങ്ങൾ പരിശോധിക്കുക.",
        "ProvideDocs": "രേഖകൾ നൽകുക",
        "TermsAndConditions": "സമർപ്പിക്കുന്നതിലൂടെ, നിങ്ങൾ നിബന്ധനകൾ അംഗീകരിക്കുന്നു.",
        "SubmitSecurely": "സുരക്ഷിതമായി സമർപ്പിക്കുക",
        "SubmittingProtocol": "സമർപ്പിക്കുന്നു..."
    },
    mr: {
        "ApplicantDetails": "अर्जदाराचा तपशील",
        "AttachedFiles": "संलग्न केलेल्या फाइल्स",
        "EditBtn": "संपादित करा",
        "ApplicationSummary": "अर्ज सारांश",
        "VerifyInfoDesc": "सबमिशन अंतिम करण्यापूर्वी आपली माहिती सत्यापित करा.",
        "ProvideDocs": "कागदपत्रे प्रदान करा",
        "TermsAndConditions": "सबमिट करून, आपण नियम आणि अटींशी सहमत आहात.",
        "SubmitSecurely": "सुरक्षितपणे सबमिट करा",
        "SubmittingProtocol": "सबमिट करत आहे..."
    },
    te: {
        "ApplicantDetails": "దరఖాస్తుదారు వివరాలు",
        "AttachedFiles": "జత చేసిన ఫైల్‌లు",
        "EditBtn": "సవరించు",
        "ApplicationSummary": "దరఖాస్తు సారాంశం",
        "VerifyInfoDesc": "సమర్పణను ఖరారు చేయడానికి ముందు మీ సమాచారాన్ని ధృవీకరించండి.",
        "ProvideDocs": "పత్రాలను అందించండి",
        "TermsAndConditions": "సమర్పించడం ద్వారా, మీరు నిబంధనలు మరియు షరతులను అంగీకరిస్తున్నారు.",
        "SubmitSecurely": "సురక్షితంగా సమర్పించండి",
        "SubmittingProtocol": "సమర్పిస్తోంది..."
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
    console.log(`Updated ${lang}.json with DynamicForm UI strings`);
}
