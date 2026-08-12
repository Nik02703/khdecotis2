'use client';

// Checkout Page Component
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';


import { useCart } from '@/context/CartContext';
import { useOrders } from '@/context/OrderContext';
import Button from '@/components/ui/Button';
import styles from './page.module.css';

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry"
];

const INDIAN_DISTRICTS = {
  "Gujarat": ["Ahmedabad", "Amreli", "Anand", "Aravalli", "Banaskantha", "Bharuch", "Bhavnagar", "Botad", "Chhota Udaipur", "Dahod", "Dang", "Devbhumi Dwarka", "Gandhinagar", "Gir Somnath", "Jamnagar", "Junagadh", "Kheda", "Kutch", "Mahisagar", "Mehsana", "Morbi", "Narmada", "Navsari", "Panchmahal", "Patan", "Porbandar", "Rajkot", "Sabarkantha", "Surat", "Surendranagar", "Tapi", "Vadodara", "Valsad"],
  "Rajasthan": ["Ajmer", "Alwar", "Banswara", "Baran", "Barmer", "Bharatpur", "Bhilwara", "Bikaner", "Bundi", "Chittorgarh", "Churu", "Dausa", "Dholpur", "Dungarpur", "Hanumangarh", "Jaipur", "Jaisalmer", "Jalore", "Jhalawar", "Jhunjhunu", "Jodhpur", "Karauli", "Kota", "Nagaur", "Pali", "Pratapgarh", "Rajsamand", "Sawai Madhopur", "Sikar", "Sirohi", "Sri Ganganagar", "Tonk", "Udaipur"],
  "Maharashtra": ["Ahmednagar", "Akola", "Amravati", "Aurangabad", "Beed", "Bhandara", "Buldhana", "Chandrapur", "Dhule", "Gadchiroli", "Gondia", "Hingoli", "Jalgaon", "Jalna", "Kolhapur", "Latur", "Mumbai City", "Mumbai Suburban", "Nagpur", "Nanded", "Nandurbar", "Nashik", "Osmanabad", "Palghar", "Parbhani", "Pune", "Raigad", "Ratnagiri", "Sangli", "Satara", "Sindhudurg", "Solapur", "Thane", "Wardha", "Washim", "Yavatmal"],
  "Delhi": ["Central Delhi", "East Delhi", "New Delhi", "North Delhi", "North East Delhi", "North West Delhi", "Shahdara", "South Delhi", "South East Delhi", "South West Delhi", "West Delhi"],
  "Uttar Pradesh": ["Agra", "Aligarh", "Prayagraj", "Ambedkar Nagar", "Amethi", "Amroha", "Auraiya", "Azamgarh", "Baghpat", "Bahraich", "Ballia", "Balrampur", "Banda", "Barabanki", "Bareilly", "Basti", "Bhadohi", "Bijnor", "Budaun", "Bulandshahr", "Chandauli", "Chitrakoot", "Deoria", "Etah", "Etawah", "Ayodhya", "Farrukhabad", "Fatehpur", "Firozabad", "Gautam Buddha Nagar", "Ghaziabad", "Ghazipur", "Gonda", "Gorakhpur", "Hamirpur", "Hapur", "Hardoi", "Hathras", "Jalaun", "Jaunpur", "Jhansi", "Kannauj", "Kanpur Dehat", "Kanpur Nagar", "Kasganj", "Kaushambi", "Kheri", "Kushinagar", "Lalitpur", "Lucknow", "Maharajganj", "Mahoba", "Mainpuri", "Mathura", "Mau", "Meerut", "Mirzapur", "Moradabad", "Muzaffarnagar", "Pilibhit", "Pratapgarh", "Raebareli", "Rampur", "Saharanpur", "Sambhal", "Sant Kabir Nagar", "Shahjahanpur", "Shamli", "Shravasti", "Siddharthnagar", "Sitapur", "Sonbhadra", "Sultanpur", "Unnao", "Varanasi"],
  "Madhya Pradesh": ["Agar Malwa", "Alirajpur", "Anuppur", "Ashoknagar", "Balaghat", "Barwani", "Betul", "Bhind", "Bhopal", "Burhanpur", "Chhatarpur", "Chhindwara", "Damoh", "Datia", "Dewas", "Dhar", "Dindori", "Guna", "Gwalior", "Harda", "Hoshangabad", "Indore", "Jabalpur", "Jhabua", "Katni", "Khandwa", "Khargone", "Mandla", "Mandsaur", "Morena", "Narsinghpur", "Neemuch", "Panna", "Raisen", "Rajgarh", "Ratlam", "Rewa", "Sagar", "Satna", "Sehore", "Seoni", "Shahdol", "Shajapur", "Sheopur", "Shivpuri", "Sidhi", "Singrauli", "Tikamgarh", "Ujjain", "Umaria", "Vidisha"],
  "Punjab": ["Amritsar", "Barnala", "Bathinda", "Faridkot", "Fatehgarh Sahib", "Fazilka", "Ferozepur", "Gurdaspur", "Hoshiarpur", "Jalandhar", "Kapurthala", "Ludhiana", "Mansa", "Moga", "Muktsar", "Pathankot", "Patiala", "Rupnagar", "Sahibzada Ajit Singh Nagar", "Sangrur", "Shahid Bhagat Singh Nagar", "Sri Muktsar Sahib", "Tarn Taran"],
  "Haryana": ["Ambala", "Bhiwani", "Charkhi Dadri", "Faridabad", "Fatehabad", "Gurugram", "Hisar", "Jhajjar", "Jind", "Kaithal", "Karnal", "Kurukshetra", "Mahendragarh", "Nuh", "Palwal", "Panchkula", "Panipat", "Rewari", "Rohtak", "Sirsa", "Sonipat", "Yamunanagar"],
  "Karnataka": ["Bagalkot", "Ballari", "Belagavi", "Bengaluru Rural", "Bengaluru Urban", "Bidar", "Chamarajanagar", "Chikkaballapur", "Chikkamagaluru", "Chitradurga", "Dakshina Kannada", "Davanagere", "Dharwad", "Gadag", "Hassan", "Haveri", "Kalaburagi", "Kodagu", "Kolar", "Koppal", "Mandya", "Mysuru", "Raichur", "Ramanagara", "Shivamogga", "Tumakuru", "Udupi", "Uttara Kannada", "Vijayapura", "Yadgir"],
  "Tamil Nadu": ["Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore", "Dharmapuri", "Dindigul", "Erode", "Kanchipuram", "Kanyakumari", "Karur", "Krishnagiri", "Madurai", "Mayiladuthurai", "Nagapattinam", "Namakkal", "Nilgiris", "Perambalur", "Pudukkottai", "Ramanathapuram", "Ranipet", "Salem", "Sivaganga", "Tenkasi", "Thanjavur", "Theni", "Thoothukudi", "Tiruchirappalli", "Tirunelveli", "Tirupathur", "Tiruppur", "Tiruvallur", "Tiruvannamalai", "Tiruvarur", "Vellore", "Viluppuram", "Virudhunagar"],
  "West Bengal": ["Alipurduar", "Bankura", "Birbhum", "Cooch Behar", "Dakshin Dinajpur", "Darjeeling", "Hooghly", "Howrah", "Jalpaiguri", "Jhargram", "Kalimpong", "Kolkata", "Malda", "Murshidabad", "Nadia", "North 24 Parganas", "Paschim Bardhaman", "Paschim Medinipur", "Purba Bardhaman", "Purba Medinipur", "Purulia", "South 24 Parganas", "Uttar Dinajpur"],
  "Bihar": ["Araria", "Arwal", "Aurangabad", "Banka", "Begusarai", "Bhagalpur", "Bhojpur", "Buxar", "Darbhanga", "East Champaran", "Gaya", "Gopalganj", "Jamui", "Jehanabad", "Kaimur", "Katihar", "Khagaria", "Kishanganj", "Lakhisarai", "Madhepura", "Madhubani", "Munger", "Muzaffarpur", "Nalanda", "Nawada", "Patna", "Purnia", "Rohtas", "Saharsa", "Samastipur", "Saran", "Sheikhpura", "Sheohar", "Sitamarhi", "Siwan", "Supaul", "Vaishali", "West Champaran"],
  "Kerala": ["Alappuzha", "Ernakulam", "Idukki", "Kannur", "Kasaragod", "Kollam", "Kottayam", "Kozhikode", "Malappuram", "Palakkad", "Pathanamthitta", "Thiruvananthapuram", "Thrissur", "Wayanad"],
  "Telangana": ["Adilabad", "Bhadradri Kothagudem", "Hyderabad", "Jagtial", "Jangaon", "Jayashankar Bhupalpally", "Jogulamba Gadwal", "Kamareddy", "Karimnagar", "Khammam", "Kumuram Bheem", "Mahabubabad", "Mahabubnagar", "Mancherial", "Medak", "Medchal", "Mulugu", "Nalgonda", "Narayanpet", "Nirmal", "Nizamabad", "Peddapalli", "Rajanna Sircilla", "Rangareddy", "Sangareddy", "Siddipet", "Suryapet", "Vikarabad", "Wanaparthy", "Warangal", "Yadadri Bhuvanagiri"],
  "Andhra Pradesh": ["Anantapur", "Chittoor", "East Godavari", "Guntur", "Krishna", "Kurnool", "Prakasam", "Srikakulam", "Sri Potti Sriramulu Nellore", "Visakhapatnam", "Vizianagaram", "West Godavari", "YSR Kadapa"],
  "Odisha": ["Angul", "Balangir", "Balasore", "Bargarh", "Bhadrak", "Boudh", "Cuttack", "Deogarh", "Dhenkanal", "Gajapati", "Ganjam", "Jagatsinghapur", "Jajpur", "Jharsuguda", "Kalahandi", "Kandhamal", "Kendrapara", "Kendujhar", "Khordha", "Koraput", "Malkangiri", "Mayurbhanj", "Nabarangpur", "Nayagarh", "Nuapada", "Puri", "Rayagada", "Sambalpur", "Subarnapur", "Sundergarh"],
  "Assam": ["Baksa", "Barpeta", "Biswanath", "Bongaigaon", "Cachar", "Charaideo", "Chirang", "Darrang", "Dhemaji", "Dhubri", "Dibrugarh", "Dima Hasao", "Goalpara", "Golaghat", "Hailakandi", "Hojai", "Jorhat", "Kamrup", "Kamrup Metropolitan", "Karbi Anglong", "Karimganj", "Kokrajhar", "Lakhimpur", "Majuli", "Morigaon", "Nagaon", "Nalbari", "Sivasagar", "Sonitpur", "South Salmara-Mankachar", "Tinsukia", "Udalguri", "West Karbi Anglong"],
  "Chhattisgarh": ["Balod", "Baloda Bazar", "Balrampur", "Bastar", "Bemetara", "Bijapur", "Bilaspur", "Dantewada", "Dhamtari", "Durg", "Gariaband", "Gaurela Pendra Marwahi", "Janjgir-Champa", "Jashpur", "Kabirdham", "Kanker", "Kondagaon", "Korba", "Koriya", "Mahasamund", "Mungeli", "Narayanpur", "Raigarh", "Raipur", "Rajnandgaon", "Sukma", "Surajpur", "Surguja"],
  "Jharkhand": ["Bokaro", "Chatra", "Deoghar", "Dhanbad", "Dumka", "East Singhbhum", "Garhwa", "Giridih", "Godda", "Gumla", "Hazaribagh", "Jamtara", "Khunti", "Koderma", "Latehar", "Lohardaga", "Pakur", "Palamu", "Ramgarh", "Ranchi", "Sahebganj", "Seraikela Kharsawan", "Simdega", "West Singhbhum"],
  "Uttarakhand": ["Almora", "Bageshwar", "Chamoli", "Champawat", "Dehradun", "Haridwar", "Nainital", "Pauri Garhwal", "Pithoragarh", "Rudraprayag", "Tehri Garhwal", "Udham Singh Nagar", "Uttarkashi"],
  "Himachal Pradesh": ["Bilaspur", "Chamba", "Hamirpur", "Kangra", "Kinnaur", "Kullu", "Lahaul and Spiti", "Mandi", "Shimla", "Sirmaur", "Solan", "Una"],
  "Goa": ["North Goa", "South Goa"],
  "Jammu and Kashmir": ["Anantnag", "Bandipora", "Baramulla", "Budgam", "Doda", "Ganderbal", "Jammu", "Kathua", "Kishtwar", "Kulgam", "Kupwara", "Poonch", "Pulwama", "Rajouri", "Ramban", "Reasi", "Samba", "Shopian", "Srinagar", "Udhampur"],
  "Ladakh": ["Kargil", "Leh"],
  "Chandigarh": ["Chandigarh"],
  "Puducherry": ["Karaikal", "Mahe", "Puducherry", "Yanam"]
};

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function CheckoutPage() {



  const router = useRouter();
  const { cartItems, getCartTotal, getCartSubtotal, getDiscountAmount, coupon, clearCart, buyNowItem, clearBuyNow } = useCart();
  const { addOrder } = useOrders();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    address: '',
    city: '',
    state: '',
    district: '',
    postcode: '',
    phone: '',
  });

  const [orderSuccessDetails, setOrderSuccessDetails] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentState, setPaymentState] = useState('idle'); // 'idle' | 'processing' | 'cancelled' | 'failed'
  const [paymentMethod, setPaymentMethod] = useState('online'); // 'online' or 'cod'
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [addressErrors, setAddressErrors] = useState({});
  const [isStateDropdownOpen, setIsStateDropdownOpen] = useState(false);
  const [stateSearch, setStateSearch] = useState('');
  const [isDistrictDropdownOpen, setIsDistrictDropdownOpen] = useState(false);
  const [districtSearch, setDistrictSearch] = useState('');
  const [pinStatus, setPinStatus] = useState('idle'); // 'idle' | 'loading' | 'valid' | 'invalid'
  const [pinMessage, setPinMessage] = useState('');
  const [isVerifyingPin, setIsVerifyingPin] = useState(false);





  const [mounted, setMounted] = useState(false);

  const getEstimatedDeliveryDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 4);
    return d.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  const encodeImg = (url) => {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    try {
      const decoded = decodeURIComponent(url);
      return decoded.split('/').map(p => encodeURIComponent(p)).join('/');
    } catch (e) {
      return url;
    }
  };

  const activeItems = buyNowItem ? [buyNowItem] : cartItems;

  // Calculate pricing with coupon discount & shipping
  let subtotal = 0;
  let discountAmt = 0;
  if (buyNowItem) {
    const p = typeof buyNowItem.price === 'string' ? parseFloat(buyNowItem.price.replace(/,/g, '')) : (buyNowItem.price || buyNowItem.currentPrice || 0);
    subtotal = p * (buyNowItem.quantity || 1);
    // No coupon for buy-now items
    discountAmt = 0;
  } else {
    subtotal = getCartSubtotal();
    discountAmt = getDiscountAmount();
  }
  const discountedSubtotal = subtotal - discountAmt;
  const shippingCharges = discountedSubtotal > 400 ? 0 : 79;
  const computedTotal = discountedSubtotal + shippingCharges;
  const formattedTotal = computedTotal.toLocaleString('en-IN');

  useEffect(() => {
    setMounted(true);
    try {
      const savedAddress = localStorage.getItem('khd_guest_address');
      if (savedAddress) {
        const parsed = JSON.parse(savedAddress);
        setFormData(prev => ({ ...prev, ...parsed }));
      }
    } catch(e) {}
  }, []);

  // ─── Debounced PIN Code Verification ───
  useEffect(() => {

    const code = formData.postcode;
    if (!code || code.length < 6 || !/^\d{6}$/.test(code)) {
      setPinStatus('idle');
      setPinMessage('');
      setIsVerifyingPin(false);
      return;
    }

    setIsVerifyingPin(true);
    setPinStatus('loading');
    setPinMessage('Verifying PIN code...');

    const timer = setTimeout(async () => {
      try {
        const query = new URLSearchParams({
          code,
          state: formData.state || '',
          district: formData.district || ''
        });
        const res = await fetch(`/api/pincode?${query.toString()}`);
        const data = await res.json();

        if (data.valid) {
          setPinStatus('valid');
          setPinMessage(data.message || '✓ PIN code verified');
          setAddressErrors(prev => {
            const next = { ...prev };
            delete next.postcode;
            return next;
          });
        } else {
          setPinStatus('invalid');
          setPinMessage(data.message || 'Invalid PIN code.');
          setAddressErrors(prev => ({ ...prev, postcode: data.message || 'Invalid PIN code.' }));
        }
      } catch (err) {
        console.error('PIN code check error:', err);
        setPinStatus('idle');
        setPinMessage('');
      } finally {
        setIsVerifyingPin(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [formData.postcode, formData.state, formData.district]);

  /**
   * Validate individual fields in the shipping address form
   */
  const validateAddressForm = () => {
    const errors = {};
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email address.";
    }
    if (!formData.firstName?.trim()) {
      errors.firstName = "First name is required.";
    }
    if (!formData.lastName?.trim()) {
      errors.lastName = "Last name is required.";
    }
    if (!formData.address?.trim()) {
      errors.address = "Address is required.";
    }
    if (!formData.city?.trim()) {
      errors.city = "City is required.";
    }
    if (!formData.postcode || !/^\d{6}$/.test(formData.postcode)) {
      errors.postcode = "Postcode must be exactly 6 digits.";
    } else if (isVerifyingPin) {
      errors.postcode = "PIN code verification in progress. Please wait a moment.";
    } else if (pinStatus === 'invalid') {
      errors.postcode = pinMessage || "PIN code does not match selected State or District.";
    }

    if (!formData.state?.trim()) {
      errors.state = "State is required.";
    }
    if (!formData.district?.trim()) {
      errors.district = "District is required.";
    }
    if (!formData.phone || !/^[6-9]\d{9}$/.test(formData.phone)) {
      errors.phone = "Invalid phone number. Must be 10 digits starting with 6, 7, 8, or 9.";
    }


    setAddressErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Called when user clicks "Done" on the address card
   */
  const handleDoneClick = (e) => {
    if (e) e.preventDefault();
    if (isVerifyingPin) {
      alert("PIN code verification is in progress. Please wait a moment.");
      return;
    }
    if (pinStatus === 'invalid') {
      alert(pinMessage || "PIN code does not match the selected District or State.");
      return;
    }
    if (validateAddressForm()) {
      localStorage.setItem('khd_guest_address', JSON.stringify(formData));
      setIsEditingAddress(false);
    } else {
      setIsEditingAddress(true);
    }
  };

  /**
   * Validate the shipping form before any payment action
   */
  const validateForm = () => {
    if (isVerifyingPin) {
      alert("PIN code verification is in progress. Please wait a moment.");
      setIsEditingAddress(true);
      return false;
    }
    if (pinStatus === 'invalid') {
      alert(pinMessage || "PIN code does not match the selected District or State.");
      setIsEditingAddress(true);
      return false;
    }
    const isValid = validateAddressForm();
    if (!isValid) {
      setIsEditingAddress(true);
      return false;
    }
    if (activeItems.length === 0) {
      alert("Your cart is empty! There's nothing to checkout.");
      router.push('/shop');
      return false;
    }
    return true;
  };




  /**
   * Build the order record common to both COD and online payment
   */
  const buildOrderRecord = () => ({
    name: `${formData.firstName} ${formData.lastName}`,
    email: formData.email,
    total: `₹${formattedTotal}`,
    items: activeItems.length,
    payload: [...activeItems],
    date: new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
  });

  /**
   * Handle Cash on Delivery — same as the original flow
   */
  const handleCODSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Save address locally for future convenience
    localStorage.setItem('khd_guest_address', JSON.stringify(formData));

    const orderRecord = buildOrderRecord();
    addOrder(orderRecord, formData, 'COD');

    if (buyNowItem) {
      clearBuyNow();
    } else {
      clearCart();
    }

    setOrderSuccessDetails(orderRecord);
  };




  /**
   * Complete Online Payment Flow via Razorpay
   * 1. Save order to MongoDB (paymentStatus: pending)
   * 2. Call /api/payment/razorpay/create-order to get Razorpay token
   * 3. Open Razorpay modal
   * 4. Call /api/payment/razorpay/verify on success
   */
  const handleOnlinePayment = async (e) => {
    if (e) e.preventDefault();
    if (!validateForm()) return;
    if (isProcessing) return;

    setIsProcessing(true);
    setPaymentState('processing');

    const loaded = await loadRazorpayScript();
    if (!loaded || typeof window === 'undefined' || !window.Razorpay) {
      alert("Failed to load Razorpay payment gateway. Please check your internet connection.");
      setIsProcessing(false);
      setPaymentState('failed');
      return;
    }

    console.log('[Checkout DEBUG] ══════════════════════════════════════');
    console.log('[Checkout DEBUG] RAZORPAY ONLINE clicked');
    console.log('[Checkout DEBUG] ══════════════════════════════════════');


    try {
      // Save address locally
      localStorage.setItem('khd_guest_address', JSON.stringify(formData));

      // Step 1: Create order
      const orderRecord = buildOrderRecord();
      const orderId = addOrder(orderRecord, formData, 'Razorpay');

      // Small delay to let MongoDB save complete before initiating payment
      await new Promise(resolve => setTimeout(resolve, 800));

      // Step 2: Call payment initiation API
      const requestBody = {
        orderId: orderId,
        amount: computedTotal,
        userPhone: formData.phone,
        userEmail: formData.email,
        userName: `${formData.firstName} ${formData.lastName}`,
      };
      
      const response = await fetch('/api/payment/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (data.success && data.razorpayOrderId) {
        console.log('[Checkout DEBUG] ✅ Received Razorpay Order ID:', data.razorpayOrderId);
        
        // Step 3: Configure Razorpay Options
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, 
          amount: data.amount, // completely driven by strict backend computation
          currency: data.currency,
          name: "KH Decotis",
          description: "Order #" + orderId,
          order_id: data.razorpayOrderId,
          modal: {



            ondismiss: function () {
              console.log('[Razorpay] ⚠️ Payment modal closed / cancelled by user');
              setIsProcessing(false);
              setPaymentState('cancelled');
            }
          },
          handler: async function (response) {
             console.log('[Razorpay] ✅ Payment Captured on Frontend, verifying signature...');
             // Do NOT clear cart yet
             
             // Step 4: Verify Signature with Backend
             const verifyRes = await fetch('/api/payment/razorpay/verify', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({
                 razorpay_order_id: response.razorpay_order_id,
                 razorpay_payment_id: response.razorpay_payment_id,
                 razorpay_signature: response.razorpay_signature
               })
             });
             
             const verifyData = await verifyRes.json();
             
             if (verifyData.success) {
               console.log('[Razorpay] ✅ Signature Verified! Redirecting to success screen.');
               router.push(`/order-success?orderId=${encodeURIComponent(orderId)}`);
             } else {
               alert("Payment verification failed. Please contact support.");
               setIsProcessing(false);
               setPaymentState('failed');
             }
          },
          prefill: {
            name: `${formData.firstName} ${formData.lastName}`,
            email: formData.email,
            contact: formData.phone
          },
          theme: {
            color: "#6C4FE1" // Sleek dark aesthetic
          }
        };

        const rzp = new window.Razorpay(options);
        
        rzp.on('payment.failed', function (response){
           console.error('[Razorpay] ❌ Payment Failed:', response.error);
           alert(`Payment Failed: ${response.error.description}`);
           setIsProcessing(false);
           setPaymentState('failed');
        });

        rzp.open();

      } else {
        console.error('[Checkout DEBUG] ❌ FAILED — no Razorpay order token:', data.error);
        alert(data.error || 'Failed to initiate Razorpay payment. Please try again or use Cash on Delivery.');
        setIsProcessing(false);
        setPaymentState('failed');
      }
    } catch (error) {
      console.error('[Checkout DEBUG] ❌ EXCEPTION:', error.message);
      alert('Something went wrong. Please try again or choose Cash on Delivery.');
      setIsProcessing(false);
      setPaymentState('failed');
    }
  };

  /**
   * Common form submission handler — routes to COD or online based on selection
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    if (paymentMethod === 'cod') {
      handleCODSubmit(e);
    } else {
      handleOnlinePayment(e);
    }
  };

  // ──── COD Order Success View (inline) ────
  if (orderSuccessDetails) {
    return (
      <div className={`container animate-fade-in ${styles.page}`} style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 1rem' }}>
        <div style={{ background: '#f0fdf4', width: '70px', height: '70px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: '2px solid #bbf7d0' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </div>
        <h1 style={{ fontSize: '2.25rem', fontFamily: "var(--font-primary), 'Manrope', sans-serif", fontWeight: 600, letterSpacing: '-0.025em', marginBottom: '8px', color: '#0f172a' }}>Order Successfully Placed</h1>
        <p style={{ color: '#64748b', fontSize: '1.1rem', marginBottom: '40px' }}>Thank you for shopping, {orderSuccessDetails.name}.</p>
        
        <div style={{ width: '100%', maxWidth: '540px', background: '#fff', padding: '36px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.04)', textAlign: 'left' }}>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', fontWeight: 700, color: '#0f172a' }}>Order Details</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '28px' }}>
            <div>
              <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</div>
              <div style={{ fontWeight: 600, color: '#1e293b' }}>{orderSuccessDetails.date}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Payment Method</div>
              <div style={{ fontWeight: 600, color: '#1e293b' }}>Cash on Delivery</div>
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</div>
              <div style={{ fontWeight: 600, color: '#1e293b', wordBreak: 'break-all' }}>{orderSuccessDetails.email}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Amount</div>
              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '1.25rem' }}>{orderSuccessDetails.total}</div>
            </div>
          </div>

          <h3 style={{ fontSize: '1.1rem', margin: '36px 0 16px', fontWeight: 700, color: '#0f172a' }}>Items ({orderSuccessDetails.items})</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '36px' }}>
            {orderSuccessDetails.payload.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: idx === orderSuccessDetails.payload.length - 1 ? 'none' : '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <img src={encodeImg(item.images?.[0] || item.imageUrl || item.image) || '/placeholder.png'} alt={item.title} style={{ width: '56px', height: '56px', borderRadius: '8px', objectFit: 'cover', background: '#f8fafc', border: '1px solid #e2e8f0' }} onError={(e) => { e.target.onerror = null; e.target.src = '/placeholder.png'; }} />
                  <div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>{item.title}</div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Qty: {item.quantity} × <span style={{ color: '#0f172a' }}>₹{Number(item.price || 0).toLocaleString('en-IN')}</span></div>
                  </div>
                </div>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>₹{(Number(item.price || 0) * item.quantity).toLocaleString('en-IN')}</div>
              </div>
            ))}
          </div>
          
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'stretch' }}>
            <div style={{ flex: 1 }}>
              <Button onClick={() => router.push('/orders')} variant="primary" style={{ width: '100%', padding: '12px', fontSize: '0.95rem' }}>
                View Orders
              </Button>
            </div>
            <div style={{ flex: 1 }}>
              <Button onClick={() => router.push('/shop')} variant="outline" style={{ width: '100%', padding: '12px', fontSize: '0.95rem' }}>
                Continue Shopping
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ──── Main Checkout Form ────

  const hasAddress = Boolean(formData.firstName && formData.address && formData.phone);

  return (
    <div className={`container animate-fade-in ${styles.page}`} suppressHydrationWarning style={{ maxWidth: '1200px', margin: '0 auto', padding: '2.5rem 1rem 2.5rem 0' }}>


      <form onSubmit={paymentMethod === 'online' ? handleOnlinePayment : handleCODSubmit} suppressHydrationWarning style={{ display: 'grid', gridTemplateColumns: '440px 1fr', gap: '50px', alignItems: 'start' }}>
        
        {/* ──── LEFT COLUMN: Shipping & Billing Details ──── */}
        <div suppressHydrationWarning style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingRight: '25px', borderRight: '1px solid #e2e8f0', maxWidth: '440px', marginLeft: '-25px' }}>



          
          {/* SHIPPING ADDRESS */}
          <div>
            <div style={{ fontFamily: "var(--font-primary), 'Manrope', sans-serif", fontSize: '0.95rem', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#0f172a', marginBottom: '14px' }}>
              Shipping Address
            </div>
            
            {hasAddress && !isEditingAddress ? (
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px 24px', lineHeight: '1.65' }}>
                <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#0f172a', marginBottom: '6px' }}>
                  {formData.firstName} {formData.lastName}
                </div>
                <div style={{ fontSize: '0.95rem', color: '#334155' }}>{formData.address}</div>
                {formData.city && <div style={{ fontSize: '0.95rem', color: '#334155' }}>{formData.city}, {formData.state} {formData.postcode}</div>}
                {formData.phone && <div style={{ fontSize: '0.95rem', color: '#334155', marginTop: '4px' }}>Mob: +91 {formData.phone}</div>}
                <button
                  type="button"
                  onClick={() => setIsEditingAddress(true)}
                  style={{ color: '#7c5cbf', fontWeight: 700, fontSize: '0.9rem', border: 'none', background: 'none', cursor: 'pointer', padding: 0, marginTop: '12px', textDecoration: 'underline' }}
                >
                  Edit
                </button>
              </div>
            ) : (
              <div suppressHydrationWarning style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '1.5rem', borderRadius: '8px' }}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Email Address</label>
                  <input
                    type="email"
                    className={styles.input}
                    placeholder="your@email.com"
                    style={{ border: addressErrors.email ? '1.5px solid #ef4444' : undefined }}
                    value={formData.email}
                    onChange={e=>{ setFormData({...formData, email: e.target.value}); if(addressErrors.email) setAddressErrors({...addressErrors, email: null}); }}
                  />
                  {addressErrors.email && <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px', display: 'block', fontWeight: 600 }}>{addressErrors.email}</span>}
                </div>
                <div className={styles.row}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>First Name</label>
                    <input
                      type="text"
                      className={styles.input}
                      style={{ border: addressErrors.firstName ? '1.5px solid #ef4444' : undefined }}
                      value={formData.firstName}
                      onChange={e=>{ setFormData({...formData, firstName: e.target.value}); if(addressErrors.firstName) setAddressErrors({...addressErrors, firstName: null}); }}
                    />
                    {addressErrors.firstName && <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px', display: 'block', fontWeight: 600 }}>{addressErrors.firstName}</span>}
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Last Name</label>
                    <input
                      type="text"
                      className={styles.input}
                      style={{ border: addressErrors.lastName ? '1.5px solid #ef4444' : undefined }}
                      value={formData.lastName}
                      onChange={e=>{ setFormData({...formData, lastName: e.target.value}); if(addressErrors.lastName) setAddressErrors({...addressErrors, lastName: null}); }}
                    />
                    {addressErrors.lastName && <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px', display: 'block', fontWeight: 600 }}>{addressErrors.lastName}</span>}
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Address</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="Street address, P.O. box, etc."
                    style={{ border: addressErrors.address ? '1.5px solid #ef4444' : undefined }}
                    value={formData.address}
                    onChange={e=>{ setFormData({...formData, address: e.target.value}); if(addressErrors.address) setAddressErrors({...addressErrors, address: null}); }}
                  />
                  {addressErrors.address && <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px', display: 'block', fontWeight: 600 }}>{addressErrors.address}</span>}
                </div>
                <div className={styles.row}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>City</label>
                    <input
                      type="text"
                      className={styles.input}
                      style={{ border: addressErrors.city ? '1.5px solid #ef4444' : undefined }}
                      value={formData.city}
                      onChange={e=>{ setFormData({...formData, city: e.target.value}); if(addressErrors.city) setAddressErrors({...addressErrors, city: null}); }}
                    />
                    {addressErrors.city && <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px', display: 'block', fontWeight: 600 }}>{addressErrors.city}</span>}
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Postcode (6 Digits)</label>
                    <input
                      type="text"
                      className={styles.input}
                      maxLength={6}
                      placeholder="e.g. 390001"
                      style={{
                        border: pinStatus === 'valid'
                          ? '1.5px solid #22c55e'
                          : (pinStatus === 'invalid' || addressErrors.postcode)
                            ? '1.5px solid #ef4444'
                            : pinStatus === 'loading'
                              ? '1.5px solid #7c5cbf'
                              : undefined
                      }}
                      value={formData.postcode}
                      onChange={e => {
                        const val = e.target.value.replace(/\D/g, '');
                        setFormData({ ...formData, postcode: val });
                        if (addressErrors.postcode) setAddressErrors({ ...addressErrors, postcode: null });
                      }}
                    />
                    {pinStatus === 'loading' && (
                      <span style={{ color: '#7c5cbf', fontSize: '0.8rem', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                        <svg className={styles.spinner} style={{ width: '14px', height: '14px', flexShrink: 0 }} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="42" strokeDashoffset="12" strokeLinecap="round" />
                        </svg>
                        {pinMessage}
                      </span>
                    )}

                    {pinStatus === 'valid' && (
                      <span style={{ color: '#16a34a', fontSize: '0.85rem', marginTop: '4px', display: 'block', fontWeight: 700 }}>
                        {pinMessage}
                      </span>
                    )}
                    {pinStatus === 'invalid' && (
                      <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px', display: 'block', fontWeight: 600 }}>
                        {pinMessage}
                      </span>
                    )}
                    {pinStatus === 'idle' && addressErrors.postcode && (
                      <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px', display: 'block', fontWeight: 600 }}>
                        {addressErrors.postcode}
                      </span>
                    )}
                  </div>

                </div>
                <div className={styles.row}>
                  {/* State Dropdown */}
                  <div className={styles.formGroup} style={{ position: 'relative' }}>
                    <label className={styles.label}>State</label>
                    <div
                      onClick={() => setIsStateDropdownOpen(!isStateDropdownOpen)}
                      className={styles.input}
                      style={{
                        border: addressErrors.state ? '1.5px solid #ef4444' : '1px solid #cbd5e1',
                        background: '#ffffff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        userSelect: 'none'
                      }}
                    >
                      <span style={{ color: formData.state ? '#0f172a' : '#94a3b8' }}>
                        {formData.state || 'Select State'}
                      </span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" style={{ transform: isStateDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}>
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>

                    {isStateDropdownOpen && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          marginTop: '4px',
                          background: '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
                          zIndex: 50,
                          overflow: 'hidden'
                        }}
                      >
                        <div style={{ padding: '8px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
                          <input
                            type="text"
                            placeholder="Search state..."
                            value={stateSearch}
                            onChange={e => setStateSearch(e.target.value)}
                            onClick={e => e.stopPropagation()}
                            autoFocus
                            style={{
                              width: '100%',
                              padding: '6px 10px',
                              border: '1px solid #cbd5e1',
                              borderRadius: '6px',
                              fontSize: '0.85rem',
                              outline: 'none',
                              color: '#0f172a'
                            }}
                          />
                        </div>
                        <div style={{ maxHeight: '200px', overflowY: 'auto', padding: '4px 0' }}>
                          {INDIAN_STATES.filter(st => st.toLowerCase().includes(stateSearch.toLowerCase())).length > 0 ? (
                            INDIAN_STATES.filter(st => st.toLowerCase().includes(stateSearch.toLowerCase())).map((st) => (
                              <div
                                key={st}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFormData({ ...formData, state: st, district: '' });
                                  if (addressErrors.state) setAddressErrors({ ...addressErrors, state: null });
                                  setIsStateDropdownOpen(false);
                                  setStateSearch('');
                                }}
                                style={{
                                  padding: '10px 14px',
                                  fontSize: '0.9rem',
                                  cursor: 'pointer',
                                  color: formData.state === st ? '#7c5cbf' : '#334155',
                                  fontWeight: formData.state === st ? 700 : 400,
                                  background: formData.state === st ? '#f5f3ff' : 'transparent',
                                  transition: 'background 0.15s ease'
                                }}
                                onMouseEnter={(e) => { if (formData.state !== st) e.currentTarget.style.background = '#f8fafc'; }}
                                onMouseLeave={(e) => { if (formData.state !== st) e.currentTarget.style.background = 'transparent'; }}
                              >
                                {st}
                              </div>
                            ))
                          ) : (
                            <div style={{ padding: '12px', fontSize: '0.85rem', color: '#94a3b8', textAlign: 'center' }}>No states found</div>
                          )}
                        </div>
                      </div>
                    )}
                    {addressErrors.state && <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px', display: 'block', fontWeight: 600 }}>{addressErrors.state}</span>}
                  </div>

                  {/* District Dropdown */}
                  <div className={styles.formGroup} style={{ position: 'relative' }}>
                    <label className={styles.label}>District</label>
                    <div
                      onClick={() => {
                        if (!formData.state) {
                          alert("Please select a State first.");
                          return;
                        }
                        setIsDistrictDropdownOpen(!isDistrictDropdownOpen);
                      }}
                      className={styles.input}
                      style={{
                        border: addressErrors.district ? '1.5px solid #ef4444' : '1px solid #cbd5e1',
                        background: '#ffffff',
                        cursor: formData.state ? 'pointer' : 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        userSelect: 'none'
                      }}
                    >
                      <span style={{ color: formData.district ? '#0f172a' : '#94a3b8' }}>
                        {formData.district || (formData.state ? 'Select District' : 'Select State First')}
                      </span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" style={{ transform: isDistrictDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}>
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>

                    {isDistrictDropdownOpen && formData.state && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          marginTop: '4px',
                          background: '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
                          zIndex: 50,
                          overflow: 'hidden'
                        }}
                      >
                        <div style={{ padding: '8px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
                          <input
                            type="text"
                            placeholder="Search district..."
                            value={districtSearch}
                            onChange={e => setDistrictSearch(e.target.value)}
                            onClick={e => e.stopPropagation()}
                            autoFocus
                            style={{
                              width: '100%',
                              padding: '6px 10px',
                              border: '1px solid #cbd5e1',
                              borderRadius: '6px',
                              fontSize: '0.85rem',
                              outline: 'none',
                              color: '#0f172a'
                            }}
                          />
                        </div>
                        <div style={{ maxHeight: '200px', overflowY: 'auto', padding: '4px 0' }}>
                          {((INDIAN_DISTRICTS[formData.state] || []).filter(d => d.toLowerCase().includes(districtSearch.toLowerCase()))).length > 0 ? (
                            (INDIAN_DISTRICTS[formData.state] || []).filter(d => d.toLowerCase().includes(districtSearch.toLowerCase())).map((dist) => (
                              <div
                                key={dist}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFormData({ ...formData, district: dist });
                                  if (addressErrors.district) setAddressErrors({ ...addressErrors, district: null });
                                  setIsDistrictDropdownOpen(false);
                                  setDistrictSearch('');
                                }}
                                style={{
                                  padding: '10px 14px',
                                  fontSize: '0.9rem',
                                  cursor: 'pointer',
                                  color: formData.district === dist ? '#7c5cbf' : '#334155',
                                  fontWeight: formData.district === dist ? 700 : 400,
                                  background: formData.district === dist ? '#f5f3ff' : 'transparent',
                                  transition: 'background 0.15s ease'
                                }}
                                onMouseEnter={(e) => { if (formData.district !== dist) e.currentTarget.style.background = '#f8fafc'; }}
                                onMouseLeave={(e) => { if (formData.district !== dist) e.currentTarget.style.background = 'transparent'; }}
                              >
                                {dist}
                              </div>
                            ))
                          ) : (
                            <div style={{ padding: '12px', fontSize: '0.85rem', color: '#94a3b8', textAlign: 'center' }}>No districts found</div>
                          )}
                        </div>
                      </div>
                    )}
                    {addressErrors.district && <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px', display: 'block', fontWeight: 600 }}>{addressErrors.district}</span>}
                  </div>
                </div>

                {/* Phone Number row */}
                <div className={styles.formGroup}>
                  <label className={styles.label}>Phone Number</label>
                  <input
                    type="tel"
                    className={styles.input}
                    maxLength={10}
                    placeholder="10-digit mobile number"
                    style={{ border: addressErrors.phone ? '1.5px solid #ef4444' : undefined }}
                    value={formData.phone}
                    onChange={e => {
                      let val = e.target.value.replace(/\D/g, '');
                      if (val.startsWith('0')) {
                        val = val.replace(/^0+/, '');
                      }
                      setFormData({ ...formData, phone: val });
                      if (addressErrors.phone) setAddressErrors({ ...addressErrors, phone: null });
                    }}

                  />
                  {addressErrors.phone && <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px', display: 'block', fontWeight: 600 }}>{addressErrors.phone}</span>}
                </div>

                <button
                  type="button"
                  onClick={handleDoneClick}
                  style={{ background: '#7c5cbf', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '6px', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer', marginTop: '12px' }}
                >
                  Done
                </button>
              </div>
            )}
          </div>

          {/* ESTIMATED DELIVERY */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px 22px', display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.95rem', color: '#0f172a' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7c5cbf" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="3" width="15" height="13"></rect>
              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
              <circle cx="5.5" cy="18.5" r="2.5"></circle>
              <circle cx="18.5" cy="18.5" r="2.5"></circle>
            </svg>
            <div>
              Estimated Delivery by <strong suppressHydrationWarning>{getEstimatedDeliveryDate()}</strong>.
            </div>
          </div>

          {/* BILLING ADDRESS */}
          <div style={{ marginTop: '0.5rem' }}>
            <div style={{ fontFamily: "var(--font-primary), 'Manrope', sans-serif", fontSize: '0.95rem', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#0f172a', marginBottom: '12px' }}>
              Billing Address
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.95rem', color: '#334155' }}>
              <input type="checkbox" checked readOnly style={{ width: '18px', height: '18px', accentColor: '#7c5cbf' }} />
              Same as shipping address
            </label>
          </div>

        </div>

        {/* ──── RIGHT COLUMN: Order Summary & Payment ──── */}
        <div suppressHydrationWarning style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          
          {/* ORDER SUMMARY */}
          <div style={{ fontFamily: "var(--font-primary), 'Manrope', sans-serif", fontSize: '0.95rem', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#0f172a' }}>
            Order Summary
          </div>

          {/* Items preview */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '20px', borderBottom: '1px solid #e2e8f0' }}>
            {activeItems.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <img src={encodeImg(item.images?.[0] || item.imageUrl || item.image) || '/placeholder.png'} alt={item.title} style={{ width: '56px', height: '56px', borderRadius: '6px', objectFit: 'cover', border: '1px solid #e2e8f0' }} onError={(e) => { e.target.onerror = null; e.target.src = '/placeholder.png'; }} />
                  <div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0f172a', maxWidth: '320px', lineHeight: 1.35 }}>{item.title}</div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '3px' }}>Qty: {item.quantity || 1}</div>
                  </div>
                </div>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '1.05rem' }}>₹{(Number(item.price || 0) * (item.quantity || 1)).toLocaleString('en-IN')}</div>
              </div>
            ))}
          </div>

          {/* Price breakdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '20px', borderBottom: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', color: '#475569' }}>
              <span>{activeItems.reduce((s, i) => s + (i.quantity || 1), 0)} Item{activeItems.reduce((s, i) => s + (i.quantity || 1), 0) > 1 ? 's' : ''}</span>
              <span>₹{subtotal.toLocaleString('en-IN')}</span>
            </div>

            {discountAmt > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', color: '#16a34a', fontWeight: 600 }}>
                <span>Coupon Discount ({coupon?.code})</span>
                <span>−₹{discountAmt.toLocaleString('en-IN')}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', color: '#475569' }}>
              <span>Shipping Charges</span>
              <span style={{ color: shippingCharges === 0 ? '#10b981' : '#475569', fontWeight: shippingCharges === 0 ? 600 : 400 }}>
                {shippingCharges === 0 ? 'FREE' : `₹${shippingCharges}`}
              </span>
            </div>
          </div>

          {/* Total Amount */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '18px', borderBottom: '1px solid #e2e8f0' }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a' }}>Total Amount</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>(Inclusive of Taxes)</div>
            </div>
            <div style={{ fontWeight: 900, fontSize: '1.35rem', color: '#0f172a' }}>
              ₹{formattedTotal}
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '10px' }}>Payment Method</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label
                onClick={() => setPaymentMethod('online')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '16px 18px', borderRadius: '8px', cursor: 'pointer',
                  border: paymentMethod === 'online' ? '2px solid #7c5cbf' : '1px solid #e2e8f0',
                  background: paymentMethod === 'online' ? '#f5f3ff' : '#fff',
                }}
              >
                <div style={{
                  width: '18px', height: '18px', borderRadius: '50%',
                  border: paymentMethod === 'online' ? '5px solid #7c5cbf' : '2px solid #cbd5e1',
                  flexShrink: 0,
                }} />
                <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.95rem' }}>Pay Online (UPI / GPay / PhonePe / Card)</div>
              </label>

              <label
                onClick={() => setPaymentMethod('cod')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '16px 18px', borderRadius: '8px', cursor: 'pointer',
                  border: paymentMethod === 'cod' ? '2px solid #7c5cbf' : '1px solid #e2e8f0',
                  background: paymentMethod === 'cod' ? '#f5f3ff' : '#fff',
                }}
              >
                <div style={{
                  width: '18px', height: '18px', borderRadius: '50%',
                  border: paymentMethod === 'cod' ? '5px solid #7c5cbf' : '2px solid #cbd5e1',
                  flexShrink: 0,
                }} />
                <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.95rem' }}>Cash on Delivery</div>
              </label>
            </div>
          </div>

          {/* Cancelled State Warning Banner */}
          {paymentState === 'cancelled' && (
            <div style={{ background: '#fff7ed', color: '#c2410c', border: '1px solid #ffedd5', padding: '12px 16px', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              Payment was cancelled. Click below to retry or choose Cash on Delivery.
            </div>
          )}

          {/* Submit Button */}
          {paymentMethod === 'online' ? (
            <button
              type="submit"
              disabled={isProcessing}
              style={{
                width: '100%', padding: '18px', border: 'none', borderRadius: '8px',
                background: isProcessing ? '#a5b4fc' : '#7c5cbf',
                color: '#fff', fontSize: '1.05rem', fontWeight: 800,
                cursor: isProcessing ? 'not-allowed' : 'pointer',
                fontFamily: "var(--font-ui), 'Inter', sans-serif", letterSpacing: '0.06em',
                textTransform: 'uppercase', transition: 'all 0.2s ease',
                boxShadow: isProcessing ? 'none' : '0 4px 14px rgba(124, 92, 191, 0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              }}
            >
              {isProcessing ? (
                <>
                  <svg className={styles.spinner} style={{ width: '22px', height: '22px', flexShrink: 0 }} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="42" strokeDashoffset="12" strokeLinecap="round" />
                  </svg>
                  Processing Payment...
                </>

              ) : (
                <>
                  <span style={{ display: 'inline-flex', alignItems: 'center', marginRight: '4px' }}>
                    {/* GPay */}
                    <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#fff', border: '1px solid #d1d5db', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.12)', zIndex: 4 }}>
                      <svg width="15" height="15" viewBox="0 0 48 48">
                        <path fill="#ea4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.66 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                        <path fill="#4285f4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                        <path fill="#fbbc05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.28-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z"/>
                        <path fill="#34a853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.66 48 24 48z"/>
                      </svg>
                    </span>
                    {/* PhonePe */}
                    <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#5f259f', border: '1px solid #d1d5db', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.12)', marginLeft: '-7px', zIndex: 3 }}>
                      <span style={{ color: '#fff', fontSize: '13px', fontWeight: '900', fontFamily: 'sans-serif', lineHeight: 1 }}>&#x092A;&#x0947;</span>
                    </span>

                    {/* Paytm */}
                    <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#fff', border: '1px solid #d1d5db', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.12)', marginLeft: '-7px', zIndex: 2 }}>
                      <span style={{ color: '#002e6e', fontSize: '7.5px', fontWeight: '900', fontFamily: 'sans-serif', letterSpacing: '-0.5px', lineHeight: 1 }}>
                        <span style={{ color: '#00baf2' }}>Pay</span>tm
                      </span>
                    </span>
                    {/* BHIM / UPI */}
                    <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#fff', border: '1px solid #d1d5db', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.12)', marginLeft: '-7px', zIndex: 1 }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                        <path d="M4 18L13 4L11 18H4Z" fill="#F47920"/>
                        <path d="M20 6L11 20L13 6H20Z" fill="#059347"/>
                      </svg>
                    </span>
                  </span>
                  {paymentState === 'cancelled'
                    ? `Payment Cancelled - Retry Pay \u20B9${formattedTotal}`
                    : `Continue to Pay \u20B9${formattedTotal}`
                  }

                </>
              )}
            </button>
          ) : (
            <button
              type="submit"
              style={{
                width: '100%', padding: '18px', border: 'none', borderRadius: '8px',
                background: '#3b2d6e',
                color: '#fff', fontSize: '1.05rem', fontWeight: 800,
                cursor: 'pointer', fontFamily: "var(--font-ui), 'Inter', sans-serif", letterSpacing: '0.06em',
                textTransform: 'uppercase', transition: 'all 0.2s ease',
                boxShadow: '0 4px 14px rgba(59, 45, 110, 0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              }}
            >
              Place COD Order - \u20B9${formattedTotal}

            </button>
          )}

        </div>
      </form>
    </div>
  );
}




