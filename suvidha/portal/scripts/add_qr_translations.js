import fs from 'fs';
import path from 'path';

const localesDir = path.join(process.cwd(), 'src/locales');

const newTranslations = {
    en: {
        UploadRequired: 'Upload Required',
        Expires: 'Expires',
        SecureMobileTransfer: 'Secure Mobile Document Transfer',
        UploadStep1: 'Open the camera on your smartphone',
        UploadStep2: 'Scan the QR code to open the secure link',
        UploadStep3: 'Take a clear photo of your document',
        AwaitingUpload: 'Awaiting upload from device...',
        SimulateUpload: 'Simulate Upload (Demo)',
        UploadFromDevice: 'Upload from this device instead',
        InvalidUploadLink: 'Invalid Link',
        InvalidUploadDesc: 'This upload link is invalid or missing information.',
        UploadExpired: 'Link Expired',
        UploadExpiredDesc: 'Please look at the kiosk screen to generate a new QR code.',
        DocReceivedTitle: 'Document received!',
        DocReceivedDesc: 'You can now safely close this tab and return to the kiosk screen.',
        SecureMobileUpload: 'Secure Mobile Upload',
        UploadNoun: 'Upload',
        TakePhotoBrowse: 'Take Photo or Browse',
        CameraBestResults: 'Use your camera for best results',
        UploadingSafely: 'Uploading safely...',
        SubmitDocument: 'Submit Document',
        UseDifferentPhoto: 'Use a different photo',
        OfficialSecureConnection: 'Official Secure Connection',
        E2ETransfer: 'End-to-end encrypted transfer',
        UploadFailedRetry: 'Upload failed. Please try again.'
    },
    hi: {
        UploadRequired: 'अपलोड आवश्यक',
        Expires: 'समाप्त होता है',
        SecureMobileTransfer: 'सुरक्षित मोबाइल दस्तावेज़ स्थानांतरण',
        UploadStep1: 'अपने स्मार्टफोन पर कैमरा खोलें',
        UploadStep2: 'सुरक्षित लिंक खोलने के लिए QR कोड स्कैन करें',
        UploadStep3: 'अपने दस्तावेज़ की स्पष्ट तस्वीर लें',
        AwaitingUpload: 'डिवाइस से अपलोड की प्रतीक्षा की जा रही है...',
        SimulateUpload: 'अपलोड का अनुकरण करें (डेमो)',
        UploadFromDevice: 'इसके बजाय इस डिवाइस से अपलोड करें',
        InvalidUploadLink: 'अमान्य लिंक',
        InvalidUploadDesc: 'यह अपलोड लिंक अमान्य है या जानकारी गायब है।',
        UploadExpired: 'लिंक समाप्त हो गया',
        UploadExpiredDesc: 'कृपया नया क्यूआर कोड बनाने के लिए कियोस्क स्क्रीन देखें।',
        DocReceivedTitle: 'दस्तावेज़ प्राप्त हुआ!',
        DocReceivedDesc: 'अब आप इस टैब को सुरक्षित रूप से बंद कर सकते हैं और कियोस्क स्क्रीन पर वापस लौट सकते हैं।',
        SecureMobileUpload: 'सुरक्षित मोबाइल अपलोड',
        UploadNoun: 'अपलोड',
        TakePhotoBrowse: 'फोटो लें या ब्राउज़ करें',
        CameraBestResults: 'सर्वोत्तम परिणामों के लिए अपने कैमरे का उपयोग करें',
        UploadingSafely: 'सुरक्षित रूप से अपलोड किया जा रहा है...',
        SubmitDocument: 'दस्तावेज़ सबमिट करें',
        UseDifferentPhoto: 'एक अलग फोटो का प्रयोग करें',
        OfficialSecureConnection: 'आधिकारिक सुरक्षित कनेक्शन',
        E2ETransfer: 'एंड-टू-एंड एन्क्रिप्टेड ट्रांसफर',
        UploadFailedRetry: 'अपलोड विफल रहा। कृपया पुन: प्रयास करें।'
    },
    mr: {
        UploadRequired: 'अपलोड आवश्यक',
        Expires: 'कालबाह्य',
        SecureMobileTransfer: 'सुरक्षित मोबाइल दस्तऐवज हस्तांतरण',
        UploadStep1: 'आपल्या स्मार्टफोनवरील कॅमेरा उघडा',
        UploadStep2: 'सुरक्षित लिंक उघडण्यासाठी क्यूआर कोड स्कॅन करा',
        UploadStep3: 'आपल्या दस्तऐवजाचा स्पष्ट फोटो घ्या',
        AwaitingUpload: 'डिव्हाइसवरून अपलोडची प्रतीक्षा करत आहे...',
        SimulateUpload: 'अपलोडचे अनुकरण करा (डेमो)',
        UploadFromDevice: 'याऐवजी या डिव्हाइसवरून अपलोड करा',
        InvalidUploadLink: 'अवैध लिंक',
        InvalidUploadDesc: 'ही अपलोड लिंक अवैध आहे किंवा माहिती गहाळ आहे.',
        UploadExpired: 'लिंक कालबाह्य झाली',
        UploadExpiredDesc: 'नवीन क्यूआर कोड तयार करण्यासाठी कृपया किओस्क स्क्रीन पहा.',
        DocReceivedTitle: 'दस्तऐवज प्राप्त झाला!',
        DocReceivedDesc: 'तुम्ही आता हे टॅब सुरक्षितपणे बंद करू शकता आणि किओस्क स्क्रीनवर परत जाऊ शकता.',
        SecureMobileUpload: 'सुरक्षित मोबाइल अपलोड',
        UploadNoun: 'अ अपलोड',
        TakePhotoBrowse: 'फोटो घ्या किंवा ब्राउझ करा',
        CameraBestResults: 'सर्वोत्तम परिणामांसाठी आपला कॅमेरा वापरा',
        UploadingSafely: 'सुरक्षितपणे अपलोड करत आहे...',
        SubmitDocument: 'दस्तऐवज सबमिट करा',
        UseDifferentPhoto: 'एक वेगळा फोटो वापरा',
        OfficialSecureConnection: 'अधिकृत सुरक्षित कनेक्शन',
        E2ETransfer: 'एंड-टू-एंड एनक्रिप्टेड ट्रान्सफर',
        UploadFailedRetry: 'अपलोड अयशस्वी. कृपया पुन्हा प्रयत्न करा.'
    },
    te: {
        UploadRequired: 'అప్‌లోడ్ అవసరం',
        Expires: 'గడువు ముగుస్తుంది',
        SecureMobileTransfer: 'సురక్షిత మొబైల్ పత్ర బదిలీ',
        UploadStep1: 'మీ స్మార్ట్‌ఫోన్‌లో కెమెరాను తెరవండి',
        UploadStep2: 'సురక్షిత లింక్‌ను తెరవడానికి QR కోడ్‌ను స్కాన్ చేయండి',
        UploadStep3: 'మీ పత్రం యొక్క స్పష్టమైన ఫోటో తీయండి',
        AwaitingUpload: 'పరికరం నుండి అప్‌లోడ్ కోసం వేచి ఉంది...',
        SimulateUpload: 'అప్‌లోడ్‌ను అనుకరించండి (డెమో)',
        UploadFromDevice: 'బదులుగా ఈ పరికరం నుండి అప్‌లోడ్ చేయండి',
        InvalidUploadLink: 'చెల్లని లింక్',
        InvalidUploadDesc: 'ఈ అప్‌లోడ్ లింక్ చెల్లనిది లేదా సమాచారం లేదు.',
        UploadExpired: 'లింక్ గడువు ముగిసింది',
        UploadExpiredDesc: 'దయచేసి కొత్త QR కోడ్‌ను రూపొందించడానికి కియోస్క్ స్క్రీన్‌ను చూడండి.',
        DocReceivedTitle: 'పత్రం స్వీకరించబడింది!',
        DocReceivedDesc: 'మీరు ఇప్పుడు సురక్షితంగా ఈ ట్యాబ్‌ను మూసివేసి మునుపటి స్క్రీన్‌కి తిరిగి వెళ్లవచ్చు.',
        SecureMobileUpload: 'సురక్షిత మొబైల్ అప్‌లోడ్',
        UploadNoun: 'అప్‌లోడ్ చేయండి',
        TakePhotoBrowse: 'ఫోటో తీయండి లేదా బ్రౌజ్ చేయండి',
        CameraBestResults: 'ఉత్తమ ఫలితాల కోసం మీ కెమెరాను ఉపయోగించండి',
        UploadingSafely: 'సురక్షితంగా అప్‌లోడ్ చేయబడుతోంది...',
        SubmitDocument: 'పత్రాన్ని సమర్పించండి',
        UseDifferentPhoto: 'వేరే ఫోటోను ఉపయోగించండి',
        OfficialSecureConnection: 'అధికారిక సురక్షిత కనెక్షన్',
        E2ETransfer: 'ఎండ్-టు-ఎండ్ ఎన్‌క్రిప్టెడ్ బదిలీ',
        UploadFailedRetry: 'అప్‌లోడ్ విఫలమైంది. దయచేసి మళ్ళీ ప్రయత్నించండి.'
    },
    ml: {
        UploadRequired: 'അപ്‌ലോഡ് ആവശ്യമാണ്',
        Expires: 'കാലഹരണപ്പെടുന്നു',
        SecureMobileTransfer: 'സുരക്ഷിത മൊബൈൽ രേഖ കൈമാറ്റം',
        UploadStep1: 'നിങ്ങളുടെ സ്മാർട്ട്ഫോണിലെ ക്യാമറ തുറക്കുക',
        UploadStep2: 'സുരക്ഷിത ലിങ്ക് തുറക്കുന്നതിന് QR കോഡ് സ്കാൻ ചെയ്യുക',
        UploadStep3: 'നിങ്ങളുടെ രേഖയുടെ വ്യക്തമായ ഫോട്ടോ എടുക്കുക',
        AwaitingUpload: 'ഉപകരണത്തിൽ നിന്നുള്ള അപ്‌ലോഡിനായി കാത്തിരിക്കുന്നു...',
        SimulateUpload: 'അപ്‌ലോഡ് അനുകരിക്കുക (ഡെമോ)',
        UploadFromDevice: 'പകരം ഈ ഉപകരണത്തിൽ നിന്ന് അപ്‌ലോഡ് ചെയ്യുക',
        InvalidUploadLink: 'അസാധുവായ ലിങ്ക്',
        InvalidUploadDesc: 'ഈ അപ്‌ലോഡ് ലിങ്ക് അസാധുവാണ് അല്ലെങ്കിൽ വിവരങ്ങൾ നഷ്‌ടമായി.',
        UploadExpired: 'ലിങ്കിന്റെ കാലാവധി കഴിഞ്ഞു',
        UploadExpiredDesc: 'ഒരു പുതിയ QR കോഡ് സൃഷ്ടിക്കുന്നതിന് ദയവായി കിയോസ്ക് സ്ക്രീൻ നോക്കുക.',
        DocReceivedTitle: 'രേഖ ലഭിച്ചു!',
        DocReceivedDesc: 'നിങ്ങൾക്ക് ഇപ്പോൾ സുരക്ഷിതമായി ഈ ടാബ് അടച്ച് മുമ്പത്തെ സ്‌ക്രീനിലേക്ക് മടങ്ങാം.',
        SecureMobileUpload: 'സുരക്ഷിത മൊബൈൽ അപ്‌ലോഡ്',
        UploadNoun: 'അപ്‌ലോഡ് ചെയ്യുക',
        TakePhotoBrowse: 'ഫോട്ടോ എടുക്കുക അല്ലെങ്കിൽ ബ്രൗസ് ചെയ്യുക',
        CameraBestResults: 'മികച്ച തീരുമാനങ്ങൾക്കായി നിങ്ങളുടെ ക്യാമറ ഉപയോഗിക്കുക',
        UploadingSafely: 'സുരക്ഷിതമായി അപ്‌ലോഡ് ചെയ്യുന്നു...',
        SubmitDocument: 'രേഖ സമർപ്പിക്കുക',
        UseDifferentPhoto: 'മറ്റൊരു ഫോട്ടോ ഉപയോഗിക്കുക',
        OfficialSecureConnection: 'ഔദ്യോഗിക സുരക്ഷിത കണക്ഷൻ',
        E2ETransfer: 'അവസാനം വരെ എൻക്രിപ്റ്റ് ചെയ്ത ട്രാൻസ്ഫർ',
        UploadFailedRetry: 'അപ്‌ലോഡ് പരാജയപ്പെട്ടു. വീണ്ടും ശ്രമിക്കുക.'
    },
    ta: {
        UploadRequired: 'பதிவேற்றம் தேவை',
        Expires: 'காலாவதியாகிறது',
        SecureMobileTransfer: 'பாதுகாப்பான மொபைல் ஆவண பரிமாற்றம்',
        UploadStep1: 'உங்கள் ஸ்மார்ட்போனில் கேமராவைத் திறக்கவும்',
        UploadStep2: 'பாதுகாப்பான இணைப்பைத் திறக்க கியூஆர் குறியீட்டை ஸ்கேன் செய்யவும்',
        UploadStep3: 'உங்கள் ஆவணத்தின் தெளிவான புகைப்படத்தை எடுக்கவும்',
        AwaitingUpload: 'சாதனத்திலிருந்து பதிவேற்றத்திற்கு காத்திருக்கிறது...',
        SimulateUpload: 'பதிவேற்றத்தை உருவகப்படுத்து (டெமோ)',
        UploadFromDevice: 'பதிலாக இந்த சாதனத்திலிருந்து பதிவேற்றவும்',
        InvalidUploadLink: 'தவறான இணைப்பு',
        InvalidUploadDesc: 'இந்த பதிவேற்ற இணைப்பு தவறானது அல்லது தகவல் விடுபட்டுள்ளது.',
        UploadExpired: 'இணைப்பு காலாவதியானது',
        UploadExpiredDesc: 'புதிய QR குறியீட்டை உருவாக்க கியோஸ்க் திரையைப் பார்க்கவும்.',
        DocReceivedTitle: 'ஆவணம் பெறப்பட்டது!',
        DocReceivedDesc: 'நீங்கள் இப்போது இந்தத் தாவலைப் பாதுகாப்பாக மூடிவிட்டு முந்தைய திரைக்குத் திரும்பலாம்.',
        SecureMobileUpload: 'பாதுகாப்பான மொபைல் பதிவேற்றம்',
        UploadNoun: 'பதிவேற்றம்',
        TakePhotoBrowse: 'புகைப்படம் எடுக்கவும் அல்லது உலாவவும்',
        CameraBestResults: 'சிறந்த முடிவுகளுக்கு உங்கள் கேமராவைப் பயன்படுத்தவும்',
        UploadingSafely: 'பாதுகாப்பாக பதிவேற்றப்படுகிறது...',
        SubmitDocument: 'ஆவணத்தை சமர்ப்பிக்கவும்',
        UseDifferentPhoto: 'வேறு புகைப்படத்தைப் பயன்படுத்தவும்',
        OfficialSecureConnection: 'அதிகாரப்பூர்வ பாதுகாப்பான இணைப்பு',
        E2ETransfer: 'சங்கேதமாக்கப்பட்ட பரிமாற்றம்',
        UploadFailedRetry: 'பதிவேற்றம் தோல்வியடைந்தது. மீண்டும் முயற்சிக்கவும்.'
    },
    kn: {
        UploadRequired: 'ಅಪ್‌ಲೋಡ್ ಅಗತ್ಯವಿದೆ',
        Expires: 'ಅವಧಿ ಮುಗಿಯುತ್ತದೆ',
        SecureMobileTransfer: 'ಸುರಕ್ಷಿತ ಮೊಬೈಲ್ ಡಾಕ್ಯುಮೆಂಟ್  ವರ್ಗಾವಣೆ',
        UploadStep1: 'ನಿಮ್ಮ ಸ್ಮಾರ್ಟ್‌ಫೋನ್‌ನಲ್ಲಿ ಕ್ಯಾಮೆರಾ ತೆರೆಯಿರಿ',
        UploadStep2: 'ಸುರಕ್ಷಿತ ಲಿಂಕ್ ತೆರೆಯಲು ಕ್ಯೂಆರ್ ಕೋಡ್ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ',
        UploadStep3: 'ನಿಮ್ಮ ಡಾಕ್ಯುಮೆಂಟ್‌ನ ಸ್ಪಷ್ಟ ಫೋಟೋ ತೆಗೆದುಕೊಳ್ಳಿ',
        AwaitingUpload: 'ಸಾಧನದಿಂದ ಅಪ್‌ಲೋಡ್‌ಗಾಗಿ ಕಾಯಲಾಗುತ್ತಿದೆ...',
        SimulateUpload: 'ಅಪ್‌ಲೋಡ್ ಅನುಕರಿಸಿ (ಡೆಮೊ)',
        UploadFromDevice: 'ಬದಲಿಗೆ ಈ ಸಾಧನದಿಂದ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ',
        InvalidUploadLink: 'ಅಮಾನ್ಯ ಲಿಂಕ್',
        InvalidUploadDesc: 'ಈ ಅಪ್‌ಲೋಡ್ ಲಿಂಕ್ ಅಮಾನ್ಯವಾಗಿದೆ ಅಥವಾ ಮಾಹಿತಿಯನ್ನು ಕಳೆದುಕೊಂಡಿದೆ.',
        UploadExpired: 'ಲಿಂಕ್ ಅವಧಿ ಮುಗಿದಿದೆ',
        UploadExpiredDesc: 'ಹೊಸ ಕ್ಯೂಆರ್ ಕೋಡ್ ರಚಿಸಲು ದಯವಿಟ್ಟು ಕಿಯೋಸ್ಕ್ ಪರದೆಯನ್ನು ನೋಡಿ.',
        DocReceivedTitle: 'ಡಾಕ್ಯುಮೆಂಟ್ ಸ್ವೀಕರಿಸಲಾಗಿದೆ!',
        DocReceivedDesc: 'ನೀವು ಈಗ ಈ ಟ್ಯಾಬ್ ಅನ್ನು ಸುರಕ್ಷಿತವಾಗಿ ಮುಚ್ಚಬಹುದು ಮತ್ತು ಹಿಂದಿನ ಪರದೆಗೆ ಹಿಂತಿರುಗಬಹುದು.',
        SecureMobileUpload: 'ಸುರಕ್ಷಿತ ಮೊಬೈಲ್ ಅಪ್‌ಲೋಡ್',
        UploadNoun: 'ಅಪ್‌ಲೋಡ್ ಮಾಡಿ',
        TakePhotoBrowse: 'ಫೋಟೋ ತೆಗೆದುಕೊಳ್ಳಿ ಅಥವಾ ಬ್ರೌಸ್ ಮಾಡಿ',
        CameraBestResults: 'ಉತ್ತಮ ಫಲಿತಾಂಶಗಳಿಗಾಗಿ ನಿಮ್ಮ ಕ್ಯಾಮರಾ ಬಳಸಿ',
        UploadingSafely: 'ಸುರಕ್ಷಿತವಾಗಿ ಅಪ್‌ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...',
        SubmitDocument: 'ದಾಖಲೆಯನ್ನು ಸಲ್ಲಿಸಿ',
        UseDifferentPhoto: 'ಬೇರೆ ಫೋಟೋ ಬಳಸಿ',
        OfficialSecureConnection: 'ಅಧಿಕೃತ ಸುರಕ್ಷಿತ ಸಂಪರ್ಕ',
        E2ETransfer: 'ಎಂಡ್-ಟು-ಎಂಡ್ ಎನ್‌ಕ್ರಿಪ್ಟ್ ಮಾಡಿದ ವರ್ಗಾವಣೆ',
        UploadFailedRetry: 'ಅಪ್‌ಲೋಡ್ ವಿಫಲವಾಗಿದೆ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.'
    }
};

async function processTranslations() {
    for (const [lang, keys] of Object.entries(newTranslations)) {
        const filePath = path.join(localesDir, `${lang}.json`);
        if (fs.existsSync(filePath)) {
            let data = {};
            try {
                const fileContent = fs.readFileSync(filePath, 'utf8');
                data = JSON.parse(fileContent);
            } catch (e) {
                console.warn(`Could not parse ${filePath}, skipping...`);
                continue;
            }

            let updated = false;
            for (const [key, value] of Object.entries(keys)) {
                if (!data[key]) {
                    data[key] = value;
                    updated = true;
                }
            }

            if (updated) {
                fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
                console.log(`Updated ${lang}.json`);
            } else {
                console.log(`${lang}.json already has keys`);
            }
        }
    }
}

processTranslations();
