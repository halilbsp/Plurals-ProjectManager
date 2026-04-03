"use client";

import { useState } from "react";
import {
  HelpCircle,
  MessageSquare,
  Book,
  Mail,
  Send,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const faqs = [
  {
    q: "How do I create a new project?",
    a: "Navigate to the Project page from the sidebar, or use the project switcher in the top bar. Click '+ New Project' and enter a name to get started.",
  },
  {
    q: "Can I drag tasks between columns?",
    a: "Yes! The Kanban board supports full drag-and-drop. Simply grab a task card and move it to any column. The change is saved to the backend instantly.",
  },
  {
    q: "How do I set a due date for a task?",
    a: "Click on any task card in the Kanban board to open the task detail modal. You will find a 'Due Date' field in the right panel where you can pick a date.",
  },
  {
    q: "What does the broadcast feature do?",
    a: "Broadcasts let you send quick messages to your team. They appear as notifications for all team members. You can include emojis and tag collaborators.",
  },
  {
    q: "How do I delete a project?",
    a: "Go to the Project page and hover over the project card. Click the trash icon to delete. Note: this will also delete all tasks within that project.",
  },
];

export default function SupportPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [contactMessage, setContactMessage] = useState("");
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    if (!contactMessage.trim()) return;
    setSent(true);
    setContactMessage("");
    setTimeout(() => setSent(false), 3000);
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto flex flex-col gap-6 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-[28px] font-bold text-gray-900 dark:text-white tracking-tight">Support Center</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Find answers to common questions or reach out to our team.</p>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-[#1A1530] rounded-[24px] p-6 shadow-sm border border-gray-100 dark:border-white/10 hover:border-purple-200 dark:hover:border-purple-500/20 hover:shadow-md transition-all cursor-pointer group">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center mb-4 group-hover:bg-[#34247A] dark:group-hover:bg-[#7C5DFA] transition-colors">
            <Book size={22} className="text-[#34247A] dark:text-[#7C5DFA] group-hover:text-white transition-colors" />
          </div>
          <h3 className="font-bold text-gray-900 dark:text-white mb-1">Documentation</h3>
          <p className="text-xs text-gray-400 dark:text-gray-500">Explore guides and API references.</p>
        </div>

        <div className="bg-white dark:bg-[#1A1530] rounded-[24px] p-6 shadow-sm border border-gray-100 dark:border-white/10 hover:border-purple-200 dark:hover:border-purple-500/20 hover:shadow-md transition-all cursor-pointer group">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center mb-4 group-hover:bg-blue-600 transition-colors">
            <MessageSquare size={22} className="text-blue-600 dark:text-blue-400 group-hover:text-white transition-colors" />
          </div>
          <h3 className="font-bold text-gray-900 dark:text-white mb-1">Live Chat</h3>
          <p className="text-xs text-gray-400 dark:text-gray-500">Chat with our support team in real-time.</p>
        </div>

        <div className="bg-white dark:bg-[#1A1530] rounded-[24px] p-6 shadow-sm border border-gray-100 dark:border-white/10 hover:border-purple-200 dark:hover:border-purple-500/20 hover:shadow-md transition-all cursor-pointer group">
          <div className="w-12 h-12 rounded-2xl bg-green-50 dark:bg-green-500/10 flex items-center justify-center mb-4 group-hover:bg-green-600 transition-colors">
            <Mail size={22} className="text-green-600 dark:text-green-400 group-hover:text-white transition-colors" />
          </div>
          <h3 className="font-bold text-gray-900 dark:text-white mb-1">Email Support</h3>
          <p className="text-xs text-gray-400 dark:text-gray-500">We typically respond within 24 hours.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* FAQ */}
        <div className="lg:col-span-7">
          <div className="bg-white dark:bg-[#1A1530] rounded-[24px] shadow-sm border border-gray-100 dark:border-white/10 p-6 transition-colors">
            <div className="flex items-center gap-2 mb-6">
              <HelpCircle size={20} className="text-[#34247A] dark:text-[#7C5DFA]" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Frequently Asked Questions</h2>
            </div>

            <div className="space-y-2">
              {faqs.map((faq, i) => (
                <div key={i} className="border border-gray-100 dark:border-white/10 rounded-2xl overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                  >
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 pr-4">{faq.q}</span>
                    {openFaq === i ? (
                      <ChevronUp size={18} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
                    ) : (
                      <ChevronDown size={18} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
                    )}
                  </button>
                  {openFaq === i && (
                    <div className="px-5 pb-4 text-sm text-gray-500 dark:text-gray-400 leading-relaxed border-t border-gray-50 dark:border-white/5 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-5">
          <div className="bg-white dark:bg-[#1A1530] rounded-[24px] shadow-sm border border-gray-100 dark:border-white/10 p-6 transition-colors">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Send a Message</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Describe your issue and we will get back to you.</p>

            <div className="flex flex-col gap-4">
              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Subject</label>
                <input
                  placeholder="e.g. Bug report, Feature request..."
                  className="w-full border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 rounded-xl px-4 py-3 text-sm text-gray-700 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-purple-100 dark:focus:ring-purple-500/20 focus:border-[#34247A] dark:focus:border-[#7C5DFA] transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Message</label>
                <textarea
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  rows={5}
                  placeholder="Tell us more about your issue..."
                  className="w-full border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 rounded-xl px-4 py-3 text-sm text-gray-700 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-purple-100 dark:focus:ring-purple-500/20 focus:border-[#34247A] dark:focus:border-[#7C5DFA] resize-none transition-colors"
                />
              </div>

              <button
                onClick={handleSend}
                className={`flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-sm font-bold transition-all active:scale-[0.97] ${
                  sent
                    ? "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border border-green-100 dark:border-green-500/20"
                    : "bg-[#34247A] hover:bg-[#2A1D63] text-white shadow-lg shadow-purple-900/15"
                }`}
              >
                {sent ? (
                  <>✅ Message Sent!</>
                ) : (
                  <>
                    <Send size={16} />
                    Send Message
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}