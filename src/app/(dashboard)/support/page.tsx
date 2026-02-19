'use client';

import { useState } from 'react';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  HelpCircle, 
  BookOpen, 
  MessageSquare, 
  ChevronDown, 
  ChevronRight,
  Search,
  Send,
  ExternalLink,
  FileText,
  Clock,
  CheckCircle
} from 'lucide-react';

type FAQ = {
  question: string;
  answer: string;
  category: string;
};

type KBArticle = {
  id: string;
  title: string;
  category: string;
  excerpt: string;
};

const faqs: FAQ[] = [
  {
    category: 'Getting Started',
    question: 'How do I add my first worker?',
    answer: 'Navigate to Staff > Worker and click "Add Worker". Fill in the required information (first name, last name, phone) and optionally add email, position, hire date, and hourly rate. Click "Add Worker" to save.'
  },
  {
    category: 'Getting Started',
    question: 'How does time tracking work?',
    answer: 'Workers can clock in/out via SMS, WhatsApp, or the worker portal. Administrators can also manually add time entries from the Live Status page.'
  },
  {
    category: 'Scheduling',
    question: 'How do I create a schedule?',
    answer: 'Go to the Calendar page to view and manage schedules. You can create shifts by clicking on a day and filling in the shift details including start time, end time, and break duration.'
  },
  {
    category: 'Scheduling',
    question: 'Can workers see their schedules?',
    answer: 'Yes! When workers log into their portal, they can view their assigned shifts, request time off, and swap shifts with coworkers (pending approval).'
  },
  {
    category: 'Payroll',
    question: 'How do I run payroll?',
    answer: 'Navigate to Payroll to view pay periods. You can review time entries, make adjustments, and close periods to finalize pay. The system calculates regular and overtime hours automatically.'
  },
  {
    category: 'Integrations',
    question: 'How do I connect Twilio?',
    answer: 'Go to Integrations page to configure Twilio. You\'ll need your Account SID, Auth Token, and Verify Service SID from your Twilio dashboard.'
  },
  {
    category: 'Integrations',
    question: 'What communication channels are supported?',
    answer: 'MyPocketWatch supports SMS, WhatsApp, Telegram, and Facebook Messenger for worker communications.'
  },
  {
    category: 'Account',
    question: 'How do I change my password?',
    answer: 'Go to Profile > Account Settings to update your password. You can also manage your company settings and notification preferences there.'
  }
];

const kbArticles: KBArticle[] = [
  {
    id: '1',
    category: 'Getting Started',
    title: 'Quick Start Guide',
    excerpt: 'Learn the basics of setting up your account and adding your first workers.'
  },
  {
    id: '2',
    category: 'Workers & Time Tracking',
    title: 'Managing Workers',
    excerpt: 'How to add, edit, and organize workers in your company.'
  },
  {
    id: '3',
    category: 'Workers & Time Tracking',
    title: 'Time Tracking Methods',
    excerpt: 'Understanding different ways workers can clock in and out.'
  },
  {
    id: '4',
    category: 'Schedules & Calendar',
    title: 'Creating Schedules',
    excerpt: 'Step-by-step guide to creating and managing work schedules.'
  },
  {
    id: '5',
    category: 'Schedules & Calendar',
    title: 'Schedule Templates',
    excerpt: 'Save time by using schedule templates for recurring shifts.'
  },
  {
    id: '6',
    category: 'Payroll & Reports',
    title: 'Running Payroll',
    excerpt: 'Complete guide to processing payroll in MyPocketWatch.'
  },
  {
    id: '7',
    category: 'Integrations',
    title: 'Twilio Setup',
    excerpt: 'Configure Twilio for SMS and verification services.'
  },
  {
    id: '8',
    category: 'Troubleshooting',
    title: 'Common Issues',
    excerpt: 'Solutions to frequently encountered problems.'
  }
];

export default function SupportPage() {
  const [activeTab, setActiveTab] = useState<'faq' | 'kb' | 'contact'>('faq');
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    company: '',
    category: '',
    priority: 'medium',
    subject: '',
    description: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const filteredFAQs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredKB = kbArticles.filter(article =>
    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setSubmitting(false);
    setSubmitted(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Help Center</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Find answers, browse articles, or contact support
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search for help..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('faq')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'faq'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          <HelpCircle className="h-4 w-4" />
          FAQ
        </button>
        <button
          onClick={() => setActiveTab('kb')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'kb'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          <BookOpen className="h-4 w-4" />
          Knowledge Base
        </button>
        <button
          onClick={() => setActiveTab('contact')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'contact'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          Contact Support
        </button>
      </div>

      {/* FAQ Tab */}
      {activeTab === 'faq' && (
        <div className="space-y-4">
          {filteredFAQs.length === 0 ? (
            <Card className="p-8 text-center">
              <HelpCircle className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
              <p className="mt-4 text-gray-500">No FAQs match your search</p>
            </Card>
          ) : (
            filteredFAQs.map((faq, index) => (
              <Card key={index} className="overflow-hidden">
                <button
                  onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                  className="flex w-full items-center justify-between p-4 text-left"
                >
                  <div>
                    <Badge variant="default" className="mb-2 text-xs">
                      {faq.category}
                    </Badge>
                    <p className="font-medium">{faq.question}</p>
                  </div>
                  {expandedFAQ === index ? (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  )}
                </button>
                {expandedFAQ === index && (
                  <div className="border-t border-gray-200 px-4 pb-4 pt-2 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400">{faq.answer}</p>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      )}

      {/* Knowledge Base Tab */}
      {activeTab === 'kb' && (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredKB.length === 0 ? (
            <Card className="col-span-2 p-8 text-center">
              <BookOpen className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
              <p className="mt-4 text-gray-500">No articles match your search</p>
            </Card>
          ) : (
            filteredKB.map((article) => (
              <Card key={article.id} className="cursor-pointer transition-shadow hover:shadow-md">
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <Badge variant="default" className="mb-2 text-xs">
                        {article.category}
                      </Badge>
                      <CardTitle className="mb-2">{article.title}</CardTitle>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{article.excerpt}</p>
                    </div>
                    <FileText className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-sm text-blue-600">
                    <span>Read more</span>
                    <ExternalLink className="h-3 w-3" />
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Contact Support Tab */}
      {activeTab === 'contact' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardTitle className="mb-4">Submit a Support Request</CardTitle>
            {submitted ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle className="h-16 w-16 text-green-500" />
                <h3 className="mt-4 text-lg font-semibold">Request Submitted!</h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  We&apos;ve received your request and will get back to you within 24 hours.
                </p>
                <Button 
                  onClick={() => setSubmitted(false)} 
                  variant="secondary" 
                  className="mt-4"
                >
                  Submit Another Request
                </Button>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Your Name *
                    </label>
                    <input
                      required
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Email *
                    </label>
                    <input
                      required
                      type="email"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Company Name
                  </label>
                  <input
                    value={contactForm.company}
                    onChange={(e) => setContactForm({ ...contactForm, company: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Issue Category *
                    </label>
                    <select
                      required
                      value={contactForm.category}
                      onChange={(e) => setContactForm({ ...contactForm, category: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
                    >
                      <option value="">Select category...</option>
                      <option value="account">Account & Billing</option>
                      <option value="workers">Workers & Time Tracking</option>
                      <option value="scheduling">Scheduling & Calendar</option>
                      <option value="payroll">Payroll</option>
                      <option value="integrations">Integrations</option>
                      <option value="technical">Technical Issue</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Priority *
                    </label>
                    <select
                      required
                      value={contactForm.priority}
                      onChange={(e) => setContactForm({ ...contactForm, priority: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
                    >
                      <option value="low">Low - General Question</option>
                      <option value="medium">Medium - Issue Affecting Work</option>
                      <option value="high">High - Blocking Important Task</option>
                      <option value="urgent">Urgent - System Down</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Subject *
                  </label>
                  <input
                    required
                    value={contactForm.subject}
                    onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Description *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={contactForm.description}
                    onChange={(e) => setContactForm({ ...contactForm, description: e.target.value })}
                    placeholder="Please describe the issue in detail..."
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
                  />
                </div>
                <Button type="submit" loading={submitting} className="w-full">
                  {submitting ? 'Submitting...' : 'Submit Request'}
                  {!submitting && <Send className="h-4 w-4" />}
                </Button>
              </form>
            )}
          </Card>

          {/* Contact Info */}
          <div className="space-y-4">
            <Card>
              <CardTitle className="mb-4">Contact Information</CardTitle>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-5 w-5 text-gray-400" />
                  <span>support@mypocketwatch.com</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-gray-400" />
                  <span>Mon-Fri, 9am-5pm EST</span>
                </div>
              </div>
            </Card>

            <Card>
              <CardTitle className="mb-4">Response Times</CardTitle>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Urgent</span>
                  <span className="font-medium">~1 hour</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">High</span>
                  <span className="font-medium">~4 hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Medium</span>
                  <span className="font-medium">~24 hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Low</span>
                  <span className="font-medium">~48 hours</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
