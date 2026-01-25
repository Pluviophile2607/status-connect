import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Briefcase, 
  CheckCircle,
  ArrowRight,
  Eye,
  Clock,
  Smartphone,
  CreditCard,
  Zap,
  Menu,
  Wallet,
  IndianRupee, // For Rupee icon if available, otherwise fallback
  Handshake, // For Handshake
  Check
} from 'lucide-react';
// Import the logo
import aizLogo from '@/assets/aiz-logo.jpeg';

const Index = () => {
  const { profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && profile) {
      const redirectPath = profile.role === 'agent' ? '/agent/dashboard' : '/business/dashboard';
      navigate(redirectPath, { replace: true });
    }
  }, [profile, loading, navigate]);

  return (
    <div className="min-h-screen bg-white font-sans text-slate-800">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-sm border-b border-gray-100">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img 
               src={aizLogo} 
               alt="Aizboostr Logo" 
               className="h-8 w-auto rounded-sm object-contain" 
            />
            <span className="text-xl font-bold tracking-tight text-slate-900">Aizboostr</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#how-it-works" className="hover:text-blue-600 transition-colors">How It Works</a>
            <a href="#pricing" className="hover:text-blue-600 transition-colors">Pricing</a>
            <Link to="/auth">
               <Button variant="outline" size="sm" className="rounded-md px-5 border-slate-200">
                 Login
               </Button>
            </Link>
            <Link to="/auth">
               <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white rounded-md px-5">
                 Get Started
               </Button>
            </Link>
          </div>

          <div className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Split Section */}
      <div className="pt-16 min-h-[600px] flex flex-col md:flex-row">
        {/* Business Side (Advertisers) */}
        <div className="flex-1 bg-blue-50 p-8 md:p-16 flex flex-col justify-center border-b md:border-b-0 md:border-r border-blue-100">
          <div className="max-w-md mx-auto md:mx-0">
            {/* Tagline/Pre-header can go here if needed */}
            <h1 className="text-4xl md:text-5xl font-bold text-blue-900 mb-4 leading-tight">
              Need Guaranteed WhatsApp Visibility?
            </h1>
            <p className="text-slate-700 mb-8 text-lg">
              Reach local customers. Pay-per-view. Fixed rate ₹1/view.
            </p>
            
            <Link to="https://aizboostr.com/">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 py-6 h-auto w-full md:w-auto rounded-lg shadow-lg hover:shadow-blue-500/20 transition-all mb-8">
                BUY Guaranteed Views
              </Button>
            </Link>

            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-slate-700">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                <span>Fixed rate: ₹1/view</span>
              </li>
               <li className="flex items-center gap-3 text-slate-700">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                <span>Real human verification</span>
              </li>
               <li className="flex items-center gap-3 text-slate-700">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                <span>Track delivery in 24h</span>
              </li>
            </ul>
             
             {/* Illustration Placeholder */}
             {/* <div className="mt-8 md:mt-12 p-6 bg-white rounded-xl border border-blue-100 shadow-sm flex items-center justify-center h-32 md:h-40">
                <div className="text-center text-blue-300">
                    <Briefcase className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <span className="text-sm">Dashboard/Analytics Illustration</span>
                </div>
             </div> */}
          </div>
        </div>

        {/* Agent Side (Publishers) */}
        <div className="flex-1 bg-green-50 p-8 md:p-16 flex flex-col justify-center">
           <div className="max-w-md mx-auto md:mx-0">
            <h1 className="text-4xl md:text-5xl font-bold text-green-900 mb-4 leading-tight">
               Have 100+ WhatsApp Views?
            </h1>
            <p className="text-slate-700 mb-8 text-lg">
              Monetize your reach. Simple tasks.
            </p>
            
            <Link to="/auth?role=agent">
              <Button className="bg-green-600 hover:bg-green-700 text-white text-lg px-8 py-6 h-auto w-full md:w-auto rounded-lg shadow-lg hover:shadow-green-500/20 transition-all mb-8">
                EARN by Posting Status
              </Button>
            </Link>

            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-slate-700">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span>Monetize your reach</span>
              </li>
               <li className="flex items-center gap-3 text-slate-700">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span>Simple tasks</span>
              </li>
               <li className="flex items-center gap-3 text-slate-700">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span>See screenshot verification</span>
              </li>
            </ul>

             {/* Illustration Placeholder */}
             {/* <div className="mt-8 md:mt-12 p-6 bg-white rounded-xl border border-green-100 shadow-sm flex items-center justify-center h-32 md:h-40">
                <div className="text-center text-green-300">
                    <Smartphone className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <span className="text-sm">Mobile Phone/Wallet Illustration</span>
                </div>
             </div> */}
          </div>
        </div>
      </div>

      {/* How it Works */}
      <section id="how-it-works" className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-5xl text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-16">How Aizboostr Works for Everyone</h2>
          
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 relative">
             {/* Connecting Line (Desktop) */}
            <div className="hidden md:block absolute top-12 left-20 right-20 h-0.5 bg-slate-200 -z-10"></div>

            {/* Step 1 */}
            <div className="flex-1 max-w-xs md:px-4">
              <div className="h-24 w-24 bg-white rounded-full border-2 border-blue-100 shadow-sm flex items-center justify-center mx-auto mb-6 z-10 relative text-blue-600">
                 <Handshake className="h-10 w-10" />
              </div>
              <h3 className="font-bold text-lg mb-2 text-slate-900">Marketplace Matching</h3>
              <p className="text-slate-600 text-sm">Businesses post campaigns, Agents commit instantly.</p>
            </div>

             {/* Step 2 */}
            <div className="flex-1 max-w-xs md:px-4 mt-8 md:mt-0">
              <div className="h-24 w-24 bg-white rounded-full border-2 border-blue-100 shadow-sm flex items-center justify-center mx-auto mb-6 z-10 relative text-blue-600">
                 <Clock className="h-10 w-10" />
              </div>
               <h3 className="font-bold text-lg mb-2 text-slate-900">23-Hour Execution</h3>
               <p className="text-slate-600 text-sm">Agents post auto-watermarked status.</p>
            </div>

             {/* Step 3 */}
            <div className="flex-1 max-w-xs md:px-4 mt-8 md:mt-0">
              <div className="h-24 w-24 bg-white rounded-full border-2 border-green-100 shadow-sm flex items-center justify-center mx-auto mb-6 z-10 relative text-green-600">
                 <Check className="h-10 w-10" /> {/* Check/Money icon equivalent */}
              </div>
               <h3 className="font-bold text-lg mb-2 text-slate-900">Verified Success</h3>
               <p className="text-slate-600 text-sm">System verifies screenshot, Agents get paid.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 px-4 bg-slate-50">
        <div className="container mx-auto max-w-5xl">
           <h2 className="text-3xl font-bold text-slate-900 mb-12 text-center">Why Choose Aizboostr?</h2>
           
           <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
               {/* Card 1 */}
               <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                   <div className="bg-blue-50 w-14 h-14 rounded-full flex items-center justify-center mb-6">
                       <Eye className="h-7 w-7 text-blue-600" />
                   </div>
                   <h3 className="font-bold text-lg mb-2 text-slate-900">Transparent Tracking</h3>
                   <p className="text-sm text-slate-600">Full visibility on your campaign performance.</p>
               </div>

               {/* Card 2 */}
               <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                   <div className="bg-blue-50 w-14 h-14 rounded-full flex items-center justify-center mb-6">
                       <IndianRupee className="h-7 w-7 text-blue-600" /> {/* Or simple '₹' text/icon */}
                   </div>
                   <h3 className="font-bold text-lg mb-2 text-slate-900">Fixed Rates</h3>
                   <p className="text-sm text-slate-600">No hidden costs. Pay only for what you get.</p>
               </div>

               {/* Card 3 */}
               <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                   <div className="bg-green-50 w-14 h-14 rounded-full flex items-center justify-center mb-6">
                       <Wallet className="h-7 w-7 text-green-600" />
                   </div>
                   <h3 className="font-bold text-lg mb-2 text-slate-900">Easy Income</h3>
                   <p className="text-sm text-slate-600">Monetize your daily status updates easily.</p>
               </div>

               {/* Card 4 */}
               <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <div className="bg-green-50 w-14 h-14 rounded-full flex items-center justify-center mb-6">
                       <Zap className="h-7 w-7 text-green-600" />
                   </div>
                   <h3 className="font-bold text-lg mb-2 text-slate-900">Fast Payments</h3>
                   <p className="text-sm text-slate-600">Quick and secure payouts to your account.</p>
               </div>
           </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-12 px-4 border-t border-slate-100">
        <div className="container mx-auto max-w-6xl grid md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-1">
             <div className="flex items-center gap-2 mb-4">
               <img 
                 src={aizLogo} 
                 alt="Aizboostr Logo" 
                 className="h-6 w-auto" 
               />
                <span className="font-bold text-slate-900">Aizboostr</span>
             </div>
             <p className="text-sm text-slate-500">The trusted platform for WhatsApp Status marketing.</p>
          </div>
          
           <div>
             <h4 className="font-bold mb-4 text-slate-900">Home</h4>
             <ul className="space-y-2 text-sm text-slate-500">
               <li><a href="#" className="hover:text-blue-600">Home</a></li>
               <li><a href="#" className="hover:text-blue-600">About</a></li>
               <li><a href="#" className="hover:text-blue-600">Contact</a></li>
             </ul>
           </div>
           
           <div>
             <h4 className="font-bold mb-4 text-slate-900">Contact Info</h4>
              <ul className="space-y-2 text-sm text-slate-500">
               <li>+91 91234 56789</li>
               <li>hello@aizboostr.com</li>
             </ul>
           </div>

           <div>
              <h4 className="font-bold mb-4 text-slate-900">Social Media</h4>
              <div className="flex gap-4">
                 <div className="h-8 w-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors cursor-pointer">
                    {/* Placeholder for social icons */}
                    <Users className="h-4 w-4" />
                 </div>
                 <div className="h-8 w-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors cursor-pointer">
                    <Briefcase className="h-4 w-4" />
                 </div>
              </div>
           </div>
        </div>
        <div className="container mx-auto mt-12 pt-8 border-t border-slate-100 text-center text-xs text-slate-400 flex justify-between">
           <span>Aizboostr - WhatsApp Status Marketing</span>
           <span>© 2026 Aizboostr</span>
        </div>
      </footer>
    </div>
  );
};

export default Index;
