// ============================================================
// Bangladesh Real Geo Dataset — Part A
// Divisions: Dhaka, Chattogram, Barishal
// Format: [english, bangla] tuples — compiled & tree-shakeable
// ============================================================

export interface GeoEntry {
  en: string;
  bn: string;
}

export interface GeoDistrict extends GeoEntry {
  div: string;
  lat: number;
  lng: number;
  up: [string, string][]; // upazilas
  th?: [string, string][]; // extra city-corporation thanas
}

export const DIVISIONS_A: GeoDistrict[] = [
  {
    en: "Dhaka", bn: "ঢাকা", div: "Dhaka", lat: 23.8103, lng: 90.4125,
    up: [["Savar", "সাভার"], ["Dhamrai", "ধামরাই"], ["Keraniganj", "কেরানীগঞ্জ"], ["Nawabganj", "নবাবগঞ্জ"], ["Dohar", "দোহার"]],
    th: [["Motijheel", "মতিঝিল"], ["Ramna", "রমনা"], ["Shahbagh", "শাহবাগ"], ["Dhanmondi", "ধানমন্ডি"], ["Gulshan", "গুলশান"], ["Banani", "বনানী"], ["Uttara", "উত্তরা"], ["Mirpur", "মিরপুর"], ["Mohammadpur", "মোহাম্মদপুর"], ["Badda", "বাড্ডা"], ["Tejgaon", "তেজগাঁও"], ["Lalbagh", "লালবাগ"], ["Kotwali", "কোতয়ালী"], ["Sutrapur", "সূত্রাপুর"], ["Demra", "ডেমরা"], ["Khilgaon", "খিলগাঁও"], ["Sabujbagh", "সবুজবাগ"], ["Jatrabari", "যাত্রাবাড়ী"], ["Pallabi", "পল্লবী"], ["Kafrul", "কাফরুল"], ["Shyamoli", "শ্যামলী"], ["Turag", "তুরাগ"], ["Cantonment", "ক্যান্টনমেন্ট"], ["Hazaribagh", "হাজারীবাগ"]],
  },
  {
    en: "Faridpur", bn: "ফরিদপুর", div: "Dhaka", lat: 23.607, lng: 89.8429,
    up: [["Faridpur Sadar", "ফরিদপুর সদর"], ["Alfadanga", "আলফাডাঙ্গা"], ["Bhanga", "ভাঙ্গা"], ["Boalmari", "বোয়ালমারী"], ["Charbhadrasan", "চরভদ্রাসন"], ["Madhukhali", "মধুখালী"], ["Nagarkanda", "নগরকান্দা"], ["Sadarpur", "সদরপুর"], ["Saltha", "সালথা"]],
  },
  {
    en: "Gazipur", bn: "গাজীপুর", div: "Dhaka", lat: 23.9999, lng: 90.4203,
    up: [["Gazipur Sadar", "গাজীপুর সদর"], ["Kaliakair", "কালিয়াকৈর"], ["Kaliganj", "কালীগঞ্জ"], ["Kapasia", "কাপাসিয়া"], ["Sreepur", "শ্রীপুর"]],
    th: [["Tongi", "টঙ্গী"]],
  },
  {
    en: "Gopalganj", bn: "গোপালগঞ্জ", div: "Dhaka", lat: 23.005, lng: 89.8266,
    up: [["Gopalganj Sadar", "গোপালগঞ্জ সদর"], ["Kashiani", "কাশিয়ানী"], ["Kotalipara", "কোটালীপাড়া"], ["Muksudpur", "মুকসুদপুর"], ["Tungipara", "টুঙ্গিপাড়া"]],
  },
  {
    en: "Kishoreganj", bn: "কিশোরগঞ্জ", div: "Dhaka", lat: 24.4449, lng: 90.7766,
    up: [["Kishoreganj Sadar", "কিশোরগঞ্জ সদর"], ["Austagram", "অষ্টগ্রাম"], ["Bajitpur", "বাজিতপুর"], ["Bhairab", "ভৈরব"], ["Hossainpur", "হোসেনপুর"], ["Itna", "ইটনা"], ["Karimganj", "করিমগঞ্জ"], ["Katiadi", "কটিয়াদী"], ["Kuliarchar", "কুলিয়ারচর"], ["Mithamain", "মিথামইন"], ["Nikli", "নিকলী"], ["Pakundia", "পাকুন্দিয়া"], ["Tarail", "তাড়াইল"]],
  },
  {
    en: "Madaripur", bn: "মাদারীপুর", div: "Dhaka", lat: 23.1641, lng: 90.1897,
    up: [["Madaripur Sadar", "মাদারীপুর সদর"], ["Kalkini", "কালকিনি"], ["Rajoir", "রাজৈর"], ["Shibchar", "শিবচর"]],
  },
  {
    en: "Manikganj", bn: "মানিকগঞ্জ", div: "Dhaka", lat: 23.8644, lng: 90.0047,
    up: [["Manikganj Sadar", "মানিকগঞ্জ সদর"], ["Daulatpur", "দৌলতপুর"], ["Ghior", "ঘিওর"], ["Harirampur", "হরিরামপুর"], ["Saturia", "সাটুরিয়া"], ["Shivalaya", "শিবালয়"], ["Singair", "সিঙ্গাইর"]],
  },
  {
    en: "Munshiganj", bn: "মুন্সিগঞ্জ", div: "Dhaka", lat: 23.5422, lng: 90.5305,
    up: [["Munshiganj Sadar", "মুন্সিগঞ্জ সদর"], ["Gazaria", "গজারিয়া"], ["Lohajang", "লৌহজং"], ["Sirajdikhan", "শিরাজদিখান"], ["Srinagar", "শ্রীনগর"], ["Tongibari", "টঙ্গিবাড়ী"]],
  },
  {
    en: "Narayanganj", bn: "নারায়ণগঞ্জ", div: "Dhaka", lat: 23.6238, lng: 90.499,
    up: [["Narayanganj Sadar", "নারায়ণগঞ্জ সদর"], ["Araihazar", "আড়াইহাজার"], ["Bandar", "বন্দর"], ["Rupganj", "রূপগঞ্জ"], ["Sonargaon", "সোনারগাঁও"]],
    th: [["Siddhirganj", "সিদ্ধিরগঞ্জ"], ["Fatullah", "ফতুল্লা"]],
  },
  {
    en: "Narsingdi", bn: "নরসিংদী", div: "Dhaka", lat: 23.9322, lng: 90.7151,
    up: [["Narsingdi Sadar", "নরসিংদী সদর"], ["Belabo", "বেলাবো"], ["Monohardi", "মনোহরদী"], ["Palash", "পলাশ"], ["Raipura", "রায়পুরা"], ["Shibpur", "শিবপুর"]],
  },
  {
    en: "Rajbari", bn: "রাজবাড়ী", div: "Dhaka", lat: 23.7574, lng: 89.6444,
    up: [["Rajbari Sadar", "রাজবাড়ী সদর"], ["Baliakandi", "বালিয়াকান্দি"], ["Goalandaghat", "গোয়ালন্দঘাট"], ["Kalukhali", "কালুখালী"], ["Pangsha", "পাংশা"]],
  },
  {
    en: "Shariatpur", bn: "শরীয়তপুর", div: "Dhaka", lat: 23.2423, lng: 90.4348,
    up: [["Shariatpur Sadar", "শরীয়তপুর সদর"], ["Bhedarganj", "ভেদারগঞ্জ"], ["Damudya", "ডামুড্যা"], ["Gosairhat", "গোসাইরহাট"], ["Naria", "নড়িয়া"], ["Zanjira", "জাজিরা"]],
  },
  {
    en: "Tangail", bn: "টাঙ্গাইল", div: "Dhaka", lat: 24.2513, lng: 89.9167,
    up: [["Tangail Sadar", "টাঙ্গাইল সদর"], ["Basail", "বাসাইল"], ["Bhuapur", "ভুয়াপুর"], ["Delduar", "দেলদুয়ার"], ["Dhanbari", "ধনবাড়ী"], ["Ghatail", "ঘাটাইল"], ["Gopalpur", "গোপালপুর"], ["Kalihati", "কালিহাতী"], ["Madhupur", "মধুপুর"], ["Mirzapur", "মির্জাপুর"], ["Nagarpur", "নাগরপুর"], ["Sakhipur", "সাকিপুর"]],
  },
  {
    en: "Bandarban", bn: "বান্দরবান", div: "Chattogram", lat: 22.1953, lng: 92.2184,
    up: [["Bandarban Sadar", "বান্দরবান সদর"], ["Ali Kadam", "আলীকদম"], ["Lama", "লামা"], ["Naikhongchhari", "নাইক্ষ্যংছড়ি"], ["Rowangchhari", "রোয়াংছড়ি"], ["Ruma", "রুমা"], ["Thanchi", "থানচি"]],
  },
  {
    en: "Brahmanbaria", bn: "ব্রাহ্মণবাড়িয়া", div: "Chattogram", lat: 23.9571, lng: 91.1119,
    up: [["Brahmanbaria Sadar", "ব্রাহ্মণবাড়িয়া সদর"], ["Akhaura", "আখাউড়া"], ["Ashuganj", "আশুগঞ্জ"], ["Bancharampur", "বাঞ্ছারামপুর"], ["Bijoynagar", "বিজয়নগর"], ["Kasba", "কসবা"], ["Nabinagar", "নবীনগর"], ["Nasirnagar", "নাসিরনগর"], ["Sarail", "সরাইল"]],
  },
  {
    en: "Chandpur", bn: "চাঁদপুর", div: "Chattogram", lat: 23.2333, lng: 90.6712,
    up: [["Chandpur Sadar", "চাঁদপুর সদর"], ["Faridganj", "ফরিদগঞ্জ"], ["Haimchar", "হাইমচর"], ["Haziganj", "হাজীগঞ্জ"], ["Kachua", "কচুয়া"], ["Matlab Dakshin", "মতলব দক্ষিণ"], ["Matlab Uttar", "মতলব উত্তর"], ["Shahrasti", "শাহরাস্তি"]],
  },
  {
    en: "Chattogram", bn: "চট্টগ্রাম", div: "Chattogram", lat: 22.3569, lng: 91.7832,
    up: [["Anwara", "আনোয়ারা"], ["Banshkhali", "বাঁশখালী"], ["Boalkhali", "বোয়ালখালী"], ["Chandanaish", "চন্দনাইশ"], ["Fatikchhari", "ফটিকছড়ি"], ["Hathazari", "হাটহাজারী"], ["Karnaphuli", "কর্ণফুলী"], ["Lohagara", "লোহাগাড়া"], ["Mirsharai", "মীরসরাই"], ["Patiya", "পটিয়া"], ["Rangunia", "রাঙ্গুনিয়া"], ["Raozan", "রাউজান"], ["Sandwip", "সন্দ্বীপ"], ["Satkania", "সাতকানিয়া"], ["Sitakunda", "সীতাকুণ্ড"]],
    th: [["Kotwali", "কোতয়ালী"], ["Pahartali", "পাহাড়তলী"], ["Panchlaish", "পাঁচলাইশ"], ["Chandgaon", "চান্দগাঁও"], ["Khulshi", "খুলশী"], ["Double Mooring", "ডাবল মুরিং"], ["Bakalia", "বাকলিয়া"], ["Halishahar", "হালিশহর"], ["Agrabad", "আগ্রাবাদ"]],
  },
  {
    en: "Cumilla", bn: "কুমিল্লা", div: "Chattogram", lat: 23.4607, lng: 91.1809,
    up: [["Cumilla Adarsha Sadar", "কুমিল্লা আদর্শ সদর"], ["Barura", "বরুড়া"], ["Brahmanpara", "ব্রাহ্মণপাড়া"], ["Burichang", "বুড়িচং"], ["Chandina", "চান্দিনা"], ["Chauddagram", "চৌদ্দগ্রাম"], ["Cumilla Sadar Dakshin", "কুমিল্লা সদর দক্ষিণ"], ["Daudkandi", "দাউদকান্দি"], ["Debidwar", "দেবিদ্বার"], ["Homna", "হোমনা"], ["Laksam", "লাকসাম"], ["Meghna", "মেঘনা"], ["Monohorgonj", "মনোহরগঞ্জ"], ["Muradnagar", "মুরাদনগর"], ["Nangalkot", "নাঙ্গলকোট"], ["Titas", "তিতাস"]],
    th: [["Cumilla Kotwali", "কুমিল্লা কোতয়ালী"]],
  },
  {
    en: "Cox's Bazar", bn: "কক্সবাজার", div: "Chattogram", lat: 21.4272, lng: 92.0058,
    up: [["Cox's Bazar Sadar", "কক্সবাজার সদর"], ["Chakaria", "চকরিয়া"], ["Kutubdia", "কুতুবদিয়া"], ["Maheshkhali", "মহেশখালী"], ["Pekua", "পেকুয়া"], ["Ramu", "রামু"], ["Teknaf", "টেকনাফ"], ["Ukhia", "উখিয়া"]],
  },
  {
    en: "Feni", bn: "ফেনী", div: "Chattogram", lat: 23.0159, lng: 91.3976,
    up: [["Feni Sadar", "ফেনী সদর"], ["Chhagalnaiya", "ছাগলনাইয়া"], ["Daganbhuiyan", "দাগনভূঁইয়া"], ["Fulgazi", "ফুলগাজী"], ["Parshuram", "পরশুরাম"], ["Sonagazi", "সোনাগাজী"]],
  },
  {
    en: "Khagrachhari", bn: "খাগড়াছড়ি", div: "Chattogram", lat: 23.1193, lng: 91.9847,
    up: [["Khagrachhari Sadar", "খাগড়াছড়ি সদর"], ["Dighinala", "দীঘিনালা"], ["Lakshmichhari", "লক্ষ্মীছড়ি"], ["Mahalchhari", "মহালছড়ি"], ["Manikchhari", "মানিকছড়ি"], ["Matiranga", "মাটিরাঙ্গা"], ["Panchhari", "পানছড়ি"], ["Ramgarh", "রামগড়"]],
  },
  {
    en: "Lakshmipur", bn: "লক্ষ্মীপুর", div: "Chattogram", lat: 22.9447, lng: 90.8282,
    up: [["Lakshmipur Sadar", "লক্ষ্মীপুর সদর"], ["Kamalnagar", "কমলনগর"], ["Raipur", "রায়পুর"], ["Ramganj", "রামগঞ্জ"], ["Ramgati", "রামগতি"]],
  },
  {
    en: "Noakhali", bn: "নোয়াখালী", div: "Chattogram", lat: 22.8696, lng: 91.0995,
    up: [["Noakhali Sadar", "নোয়াখালী সদর"], ["Begumganj", "বেগমগঞ্জ"], ["Chatkhil", "চাটখিল"], ["Companiganj", "কোম্পানিগঞ্জ"], ["Hatiya", "হাতিয়া"], ["Kabirhat", "কবিরহাট"], ["Senbagh", "সেনবাগ"], ["Sonaimuri", "সোনাইমুড়ী"], ["Subarnachar", "সুবর্ণচর"]],
  },
  {
    en: "Barishal", bn: "বরিশাল", div: "Barishal", lat: 22.701, lng: 90.3535,
    up: [["Barishal Sadar", "বরিশাল সদর"], ["Agailjhara", "আগৈলঝারা"], ["Babuganj", "বাবুগঞ্জ"], ["Bakerganj", "বাকেরগঞ্জ"], ["Banaripara", "বানারীপাড়া"], ["Gaurnadi", "গৌরনদী"], ["Hizla", "হিজলা"], ["Mehendiganj", "মেহেন্দীগঞ্জ"], ["Muladi", "মুলাদী"], ["Wazirpur", "ওয়াজিরপুর"]],
    th: [["Barishal Kotwali", "বরিশাল কোতয়ালী"]],
  },
  {
    en: "Barguna", bn: "বরগুনা", div: "Barishal", lat: 22.0953, lng: 90.1121,
    up: [["Barguna Sadar", "বরগুনা সদর"], ["Amtali", "আমতলী"], ["Bamna", "বামনা"], ["Betagi", "বেতাগী"], ["Patharghata", "পাথরঘাটা"], ["Taltali", "তালতলী"]],
  },
  {
    en: "Bhola", bn: "ভোলা", div: "Barishal", lat: 22.6859, lng: 90.6482,
    up: [["Bhola Sadar", "ভোলা সদর"], ["Burhanuddin", "বুরহানউদ্দিন"], ["Char Fasson", "চরফ্যাসন"], ["Daulatkhan", "দৌলতখান"], ["Lalmohan", "লালমোহন"], ["Manpura", "মনপুরা"], ["Tazumuddin", "তাজুমউদ্দিন"]],
  },
  {
    en: "Jhalokati", bn: "ঝালকাঠি", div: "Barishal", lat: 22.6406, lng: 90.1987,
    up: [["Jhalokati Sadar", "ঝালকাঠি সদর"], ["Kathalia", "কাঠালিয়া"], ["Nalchity", "নলচিটি"], ["Rajapur", "রাজাপুর"]],
  },
  {
    en: "Patuakhali", bn: "পটুয়াখালী", div: "Barishal", lat: 22.3596, lng: 90.3299,
    up: [["Patuakhali Sadar", "পটুয়াখালী সদর"], ["Bauphal", "বাউফল"], ["Dashmina", "দশমিনা"], ["Dumki", "ডুমকি"], ["Galachipa", "গলাচিপা"], ["Kalapara", "কালাপাড়া"], ["Mirzaganj", "মির্জাগঞ্জ"], ["Rangabali", "রাঙ্গাবালী"]],
  },
  {
    en: "Pirojpur", bn: "পিরোজপুর", div: "Barishal", lat: 22.5841, lng: 89.972,
    up: [["Pirojpur Sadar", "পিরোজপুর সদর"], ["Bhandaria", "ভাণ্ডারিয়া"], ["Kawkhali", "কাউখালী"], ["Mathbaria", "মঠবাড়িয়া"], ["Nazirpur", "নাজিরপুর"], ["Nesarabad", "নেছারাবাদ"]],
  },
];
