import fs from 'fs';

const translations = {
    en: {
        tag_energy: "Energy Sector", tag_utilities: "Utilities", tag_civic: "Civic Admin",
        tag_sanitation: "Sanitation", tag_infrastructure: "Infrastructure", tag_priority: "High Priority",
        desc_electricity: "Grid outages and residential power services",
        desc_gas: "Gas connections, leaks, and safety inspections",
        desc_water: "Quality monitoring and billing connections",
        desc_municipal: "City documentation, permits, and licensing",
        desc_waste: "Recycling schedules and garbage collection",
        desc_public_works: "Infrastructure maintenance and urban planning",
        desc_emergency: "Direct link to police, fire, and medical response"
    },
    hi: {
        tag_energy: "ऊर्जा क्षेत्र", tag_utilities: "उपयोगिताएं", tag_civic: "नागरिक प्रशासन",
        tag_sanitation: "स्वच्छता", tag_infrastructure: "बुनियादी ढांचा", tag_priority: "उच्च प्राथमिकता",
        desc_electricity: "ग्रिड आउटेज और आवासीय बिजली सेवाएं",
        desc_gas: "गैस कनेक्शन, लीक और सुरक्षा निरीक्षण",
        desc_water: "गुणवत्ता निगरानी और बिलिंग कनेक्शन",
        desc_municipal: "शहर के दस्तावेज, परमिट और लाइसेंसिंग",
        desc_waste: "रीसाइक्लिंग कार्यक्रम और कचरा संग्रहण",
        desc_public_works: "बुनियादी ढांचा रखरखाव और शहरी नियोजन",
        desc_emergency: "पुलिस, अग्नि और चिकित्सा प्रतिक्रिया के लिए सीधा लिंक"
    },
    mr: {
        tag_energy: "ऊर्जा क्षेत्र", tag_utilities: "युटिलिटीज", tag_civic: "नागरी प्रशासन",
        tag_sanitation: "स्वच्छता", tag_infrastructure: "पायाभूत सुविधा", tag_priority: "उच्च प्राधान्य",
        desc_electricity: "ग्रिड आउटेज आणि निवासी वीज सेवा",
        desc_gas: "गॅस कनेक्शन, लीक आणि सुरक्षा तपासणी",
        desc_water: "गुणवत्ता निरीक्षण आणि बिलिंग कनेक्शन",
        desc_municipal: "शहर दस्तऐवज, परवाने आणि परवाना",
        desc_waste: "पुनर्वापर वेळापत्रक आणि कचरा संकलन",
        desc_public_works: "पायाभूत सुविधा देखभाल आणि शहरी नियोजन",
        desc_emergency: "पोलीस, अग्निशमन आणि वैद्यकीय प्रतिसादासाठी थेट लिंक"
    },
    ml: {
        tag_energy: "എനർജി സെക്ടർ", tag_utilities: "യൂട്ടിലിറ്റികൾ", tag_civic: "സിവിക് അഡ്മിൻ",
        tag_sanitation: "ശുചിത്വം", tag_infrastructure: "അടിസ്ഥാന സൗകര്യം", tag_priority: "ഉയർന്ന മുൻഗണന",
        desc_electricity: "ഗ്രിഡ് ഔട്ടേജുകളും റെസിഡൻഷ്യൽ പവർ സേവനങ്ങളും",
        desc_gas: "ഗ്യാസ് കണക്ഷനുകൾ, ലീക്കുകൾ, സുരക്ഷാ പരിശോധനകൾ",
        desc_water: "ഗുണനിലവാര നിരീക്ഷണവും ബില്ലിംഗ് കണക്ഷനുകളും",
        desc_municipal: "സിറ്റി ഡോക്യുമെന്റേഷൻ, പെർമിറ്റുകൾ, ലൈസൻസിംഗ്",
        desc_waste: "റീസൈക്ലിംഗ് സമയക്രമങ്ങളും മാലിന്യ ശേഖരണവും",
        desc_public_works: "അടിസ്ഥാന സൗകര്യ പരിപാലനവും നഗരാസൂത്രണവും",
        desc_emergency: "പോലീസ്, ഫയർ, മെഡിക്കൽ പ്രതികരണം എന്നിവയിലേക്കുള്ള നേരിട്ടുള്ള ലിങ്ക്"
    },
    te: {
        tag_energy: "శక్తి రంగం", tag_utilities: "యుటిలిటీస్", tag_civic: "సివిക് అడ్మిన్",
        tag_sanitation: "పారిశుద్ధ్యం", tag_infrastructure: "మౌలిక సదుపాయాలు", tag_priority: "అధిక ప్రాధాన్యత",
        desc_electricity: "గ్రిడ్ అంతరాయాలు మరియు నివాస విద్యుత్ సేవలు",
        desc_gas: "గ్యాస్ కనెక్షన్లు, లీక్‌లు మరియు భద్రతా తనిఖీలు",
        desc_water: "నాణ్యత పర్యవేక్షణ మరియు బిల్లింగ్ కనెక్షన్లు",
        desc_municipal: "నగర పత్రాలు, అనుమతులు మరియు లైసెన్సింగ్",
        desc_waste: "రీసైక్లింగ్ షెడ్యూల్‌లు మరియు చెత్త సేకరణ",
        desc_public_works: "మౌలిక సదుపాయాల నిర్వహణ మరియు పట్టణ ప్రణాళిక",
        desc_emergency: "పోలీస్, ఫైర్ మరియు వైద్య ప్రతిస్పందనకు ప్రత్యక్ష లింక్"
    },
    ta: {
        tag_energy: "ஆற்றல் துறை", tag_utilities: "பயன்பாடுகள்", tag_civic: "குடிமை நிர்வாகம்",
        tag_sanitation: "சுகாதாரம்", tag_infrastructure: "உள்கட்டமைப்பு", tag_priority: "உயர் முன்னுரிமை",
        desc_electricity: "கட்டண தடைகள் மற்றும் குடியிருப்பு மின் சேவைகள்",
        desc_gas: "எரிவாயு இணைப்புகள், கசிவுகள் மற்றும் பாதுகாப்பு ஆய்வுகள்",
        desc_water: "தரக்கட்டுப்பாடு மற்றும் பில்லிங் இணைப்புகள்",
        desc_municipal: "நகர ஆவணங்கள், அனுமதிகள் மற்றும் உரிமங்கள்",
        desc_waste: "மறுசுழற்சி அட்டவணைகள் மற்றும் குப்பை சேகரிப்பு",
        desc_public_works: "உள்கட்டமைப்பு பராமரிப்பு மற்றும் நகர்ப்புற திட்டமிடல்",
        desc_emergency: "காவல், தீயணைப்பு மற்றும் மருத்துவ பதிலுக்கு நேரடி இணைப்பு"
    },
    kn: {
        tag_energy: "ಶಕ್ತಿ ವಲಯ", tag_utilities: "ಉಪಯುಕ್ತತೆಗಳು", tag_civic: "ನಾಗರಿಕ ಆಡಳಿತ",
        tag_sanitation: "ನೈರ್ಮಲ್ಯ", tag_infrastructure: "ಮೂಲಸೌಕರ್ಯ", tag_priority: "ಹೆಚ್ಚಿನ ಆದ್ಯತೆ",
        desc_electricity: "ಗ್ರಿಡ್ ಕಡಿತಗಳು ಮತ್ತು ವಸತಿ ವಿದ್ಯುತ್ ಸೇವೆಗಳು",
        desc_gas: "ಗ್ಯಾಸ್ ಸಂಪರ್ಕಗಳು, ಸೋರಿಕೆಗಳು ಮತ್ತು ಸುರಕ್ಷತಾ ತಪಾಸಣೆಗಳು",
        desc_water: "ಗುಣಮಟ್ಟದ ಮೇಲ್ವಿಚಾರಣೆ ಮತ್ತು ಬಿಲ್ಲಿಂಗ್ ಸಂಪರ್ಕಗಳು",
        desc_municipal: "ನಗರ ದಾಖಲೆಗಳು, ಪರವಾನಗಿಗಳು ಮತ್ತು ಲೈಸೆನ್ಸಿಂಗ್",
        desc_waste: "ಮರುಬಳಕೆ ವೇಳಾಪಟ್ಟಿಗಳು ಮತ್ತು ಕಸ ಸಂಗ್ರಹಣೆ",
        desc_public_works: "ಮೂಲಸೌಕರ್ಯ ನಿರ್ವಹಣೆ ಮತ್ತು ನಗರ ಯೋಜನೆ",
        desc_emergency: "ಪೊಲೀಸ್, ಅಗ್ನಿಶಾಮಕ ಮತ್ತು ವೈದ್ಯಕೀಯ ಪ್ರತಿಕ್ರಿಯೆಗೆ ನೇರ ಲಿಂಕ್"
    }
};

const langs = ['en', 'hi', 'mr', 'ml', 'te', 'ta', 'kn'];

langs.forEach(lang => {
    const p = `src/locales/${lang}.json`;
    if (fs.existsSync(p)) {
        const d = JSON.parse(fs.readFileSync(p));
        Object.assign(d, translations[lang]);
        fs.writeFileSync(p, JSON.stringify(d, null, 2));
    }
});

console.log('Translations inserted successfully!');
