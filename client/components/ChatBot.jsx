import React, { useState, useEffect, useRef } from 'react';
import '../css/ChatBot.css';

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "👋 Hello! Welcome to Leads Preschool Wariyapola! 😊 How can I help you today?", sender: "bot", time: new Date().toLocaleTimeString() }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Preschool Information
  const preschoolInfo = {
    name: "Leads Preschool",
    location: "Wariyapola, Sri Lanka",
    ageGroup: "3 – 5 years",
    vision: "We provide a nurturing environment where children can explore, create, and grow. Join our vibrant community today!",
    mission: "To develop confident, creative, and independent learners through play-based and activity-based learning.",
    workingHours: "Monday – Friday: 8:00 AM – 1:00 PM\nSaturday: 8:00 AM – 12:00 PM\nSunday: Closed",
    curriculum: "Activity-based learning, Montessori methods, Basic English, Maths, and Social Skills, Creative activities (art, music, dance)",
    facilities: "Safe and colorful classrooms, Indoor & outdoor play areas, CCTV monitoring, Child-friendly furniture, Clean washrooms",
    staff: "Qualified and trained teachers, Friendly caregivers, Low teacher-to-student ratio",
    contact: {
      phone: "+94 729 852 612",
      email: "leadspreschool@gmail.com",
      address: "123 Main Street, Wariyapola, Sri Lanka"
    },
    fees: {
      registration: "LKR 5,000",
      monthly: "LKR 8,000 – 12,000 (UKG and LKG)",
      daycare: "LKR 20,000"
    }
  };

  // FAQ Responses
  const getResponse = (userMessage) => {
    const lowercaseMsg = userMessage.toLowerCase();
    
    // Greetings
    if (lowercaseMsg.match(/^(hi|hello|hey|greetings|good morning|good afternoon|good evening)/)) {
      return "👋 Hello! Welcome to Leads Preschool Wariyapola! 😊 How can I help you today? You can ask about our programs, fees, timings, or how to register!";
    }
    
    // Age requirements
    if (lowercaseMsg.includes("age") || lowercaseMsg.includes("join") || lowercaseMsg.includes("old") || lowercaseMsg.includes("year")) {
      return `👶 Children from age ${preschoolInfo.ageGroup} can join our preschool. We accept children ages 3-5 years for our programs. Would you like to know more about our curriculum?`;
    }
    
    // Working hours / Timings
    if (lowercaseMsg.includes("time") || lowercaseMsg.includes("hour") || lowercaseMsg.includes("schedule") || lowercaseMsg.includes("open") || lowercaseMsg.includes("close")) {
      return `⏰ Our working hours are:\n${preschoolInfo.workingHours}\n\nWe're closed on Sundays and public holidays.`;
    }
    
    // Fees / Price / Cost
    if (lowercaseMsg.includes("fee") || lowercaseMsg.includes("cost") || lowercaseMsg.includes("price") || lowercaseMsg.includes("tuition") || lowercaseMsg.includes("payment")) {
      return `💰 Our fee structure:\n• Registration Fee: ${preschoolInfo.fees.registration}\n• Monthly Fee (UKG & LKG): ${preschoolInfo.fees.monthly}\n• Daycare: ${preschoolInfo.fees.daycare}\n\nFor more details about payment plans, please contact our office.`;
    }
    
    // Registration / Enroll
    if (lowercaseMsg.includes("register") || lowercaseMsg.includes("enroll") || lowercaseMsg.includes("admission") || lowercaseMsg.includes("apply")) {
      return `📝 To register your child at Leads Preschool:\n1. Visit our office at ${preschoolInfo.contact.address}\n2. Call us at ${preschoolInfo.contact.phone}\n3. Email us at ${preschoolInfo.contact.email}\n\nRequired documents: Birth certificate, vaccination records, and 2 passport photos.`;
    }
    
    // Contact / Phone / Email / Address
    if (lowercaseMsg.includes("contact") || lowercaseMsg.includes("phone") || lowercaseMsg.includes("call") || lowercaseMsg.includes("email") || lowercaseMsg.includes("address") || lowercaseMsg.includes("location")) {
      return `📞 Contact Details:\n• Phone: ${preschoolInfo.contact.phone}\n• Email: ${preschoolInfo.contact.email}\n• Address: ${preschoolInfo.contact.address}\n\nOffice hours: Monday-Friday 8:00 AM - 1:00 PM, Saturday 8:00 AM - 12:00 PM`;
    }
    
    // Programs / Curriculum
    if (lowercaseMsg.includes("program") || lowercaseMsg.includes("curriculum") || lowercaseMsg.includes("learn") || lowercaseMsg.includes("study") || lowercaseMsg.includes("subject")) {
      return `🎓 We offer Nursery, LKG, and UKG programs for children aged 3–5 years.\n\nOur curriculum includes:\n${preschoolInfo.curriculum}\n\nWe focus on play-based and activity-based learning!`;
    }
    
    // Meals / Food
    if (lowercaseMsg.includes("meal") || lowercaseMsg.includes("food") || lowercaseMsg.includes("snack") || lowercaseMsg.includes("lunch") || lowercaseMsg.includes("eat")) {
      return `🍎 Parents should provide meals for their children. We don't provide meals, but we have a clean eating area and supervise children during snack/lunch time. We also accommodate special dietary needs with prior notice.`;
    }
    
    // Safety / CCTV / Security
    if (lowercaseMsg.includes("safe") || lowercaseMsg.includes("security") || lowercaseMsg.includes("cctv") || lowercaseMsg.includes("protect") || lowercaseMsg.includes("monitor")) {
      return `🛡️ Safety is our top priority! We provide:\n✅ CCTV monitoring in all classrooms and play areas\n✅ Child-friendly furniture\n✅ Clean and hygienic washrooms\n✅ Secure entry system\n✅ Trained staff for emergencies\n\nYour child's safety is our responsibility!`;
    }
    
    // Facilities / Classrooms / Play areas
    if (lowercaseMsg.includes("facilit") || lowercaseMsg.includes("classroom") || lowercaseMsg.includes("play") || lowercaseMsg.includes("area") || lowercaseMsg.includes("furniture")) {
      return `🏫 Our facilities include:\n${preschoolInfo.facilities}\n\nWe maintain high standards of cleanliness and safety throughout our center.`;
    }
    
    // Teachers / Staff
    if (lowercaseMsg.includes("teacher") || lowercaseMsg.includes("staff") || lowercaseMsg.includes("caregiver") || lowercaseMsg.includes("qualified")) {
      return `👩‍🏫 Our team:\n${preschoolInfo.staff}\n\nAll our teachers are trained in early childhood education and first aid. We maintain a low teacher-to-student ratio for personalized attention.`;
    }
    
    // Vision / Mission
    if (lowercaseMsg.includes("vision") || lowercaseMsg.includes("mission") || lowercaseMsg.includes("philosophy") || lowercaseMsg.includes("approach")) {
      return `🎯 Vision: ${preschoolInfo.vision}\n\n🎯 Mission: ${preschoolInfo.mission}\n\nWe focus on developing confident, creative, and independent learners through play-based learning!`;
    }
    
    // Daycare
    if (lowercaseMsg.includes("daycare") || lowercaseMsg.includes("day care")) {
      return `🏠 Yes, we offer daycare services! Daycare fee is ${preschoolInfo.fees.daycare} per month. Daycare hours are the same as our working hours: Monday-Friday 8:00 AM - 1:00 PM and Saturday 8:00 AM - 12:00 PM.`;
    }
    
    // LKG / UKG
    if (lowercaseMsg.includes("lkg") || lowercaseMsg.includes("ukg")) {
      return `📚 We offer both LKG (Lower Kindergarten) and UKG (Upper Kindergarten) programs. Monthly fees for LKG and UKG range from ${preschoolInfo.fees.monthly}. Both programs include our full curriculum with activity-based learning.`;
    }
    
    // Thank you
    if (lowercaseMsg.includes("thank")) {
      return "🎉 You're very welcome! We're happy to help. Feel free to ask if you have any more questions about Leads Preschool. Have a great day! 😊";
    }
    
    // Default response
    return `🤔 Thank you for your interest in Leads Preschool Negombo! For more information about our programs, fees, or to schedule a visit, please contact us at ${preschoolInfo.contact.phone} or email ${preschoolInfo.contact.email}. Is there anything specific about our ${preschoolInfo.ageGroup} age programs you'd like to know?`;
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    
    const userMessage = { 
      text: input, 
      sender: "user", 
      time: new Date().toLocaleTimeString() 
    };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    
    setIsTyping(true);
    
    setTimeout(() => {
      const botResponse = getResponse(input);
      const botMessage = { 
        text: botResponse, 
        sender: "bot", 
        time: new Date().toLocaleTimeString() 
      };
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 800);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickQuestions = [
    "What age can join?",
    "Monthly fees?",
    "School hours?",
    "How to register?",
    "CCTV monitoring?",
    "Do you provide meals?"
  ];

  return (
    <>
      {!isOpen && (
        <button className="chat-toggle-btn" onClick={() => setIsOpen(true)}>
          <span className="chat-icon">💬</span>
          <span className="chat-notification">1</span>
        </button>
      )}
      
      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <div className="chat-header-info">
              <span className="chat-avatar">🎓</span>
              <div>
                <h3>Leads Preschool Wariyapola</h3>
                <p>Online • Ready to help</p>
              </div>
            </div>
            <button className="chat-close-btn" onClick={() => setIsOpen(false)}>
              ✕
            </button>
          </div>
          
          <div className="chat-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`message-wrapper ${msg.sender}`}>
                <div className={`message ${msg.sender}`}>
                  <div className="message-text">{msg.text}</div>
                  <div className="message-time">{msg.time}</div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="message-wrapper bot">
                <div className="message bot typing">
                  <span className="typing-dot">.</span>
                  <span className="typing-dot">.</span>
                  <span className="typing-dot">.</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {messages.length === 1 && (
            <div className="quick-questions">
              <p>Quick questions about Leads Preschool:</p>
              <div className="quick-buttons">
                {quickQuestions.map((q, idx) => (
                  <button key={idx} onClick={() => setInput(q)} className="quick-btn">
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <div className="chat-input-container">
            <textarea
              className="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about fees, timings, registration, programs..."
              rows="1"
            />
            <button className="chat-send-btn" onClick={sendMessage} disabled={!input.trim()}>
              📤
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatBot;