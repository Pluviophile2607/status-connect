import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  MessageSquare, 
  Users, 
  Briefcase, 
  TrendingUp,
  CheckCircle,
  ArrowRight,
  Zap,
  Shield,
  BarChart3
} from 'lucide-react';

const Index = () => {
  const { profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && profile) {
      const redirectPath = profile.role === 'agent' ? '/agent/dashboard' : '/business/dashboard';
      navigate(redirectPath, { replace: true });
    }
  }, [profile, loading, navigate]);

  const features = [
    {
      icon: Zap,
      title: 'Instant Campaign Creation',
      description: 'Create and launch WhatsApp status campaigns in minutes with our intuitive tools.',
    },
    {
      icon: Shield,
      title: 'Secure Payment Tracking',
      description: 'Track manual payments with full transparency. Mark payments as complete with ease.',
    },
    {
      icon: BarChart3,
      title: 'Real-time Analytics',
      description: 'Monitor views, leads, and campaign performance with detailed analytics.',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-foreground">StatusFlow</span>
          </div>
          <Link to="/auth">
            <Button variant="outline">
              Sign In
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-8 animate-fade-in">
            <TrendingUp className="h-4 w-4" />
            Trusted by 100+ marketing agencies
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 animate-slide-up">
            WhatsApp Status Marketing
            <span className="block text-primary">Made Simple</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-fade-in">
            The complete platform for agents and businesses to create, manage, and track 
            WhatsApp status campaigns with integrated payment tracking.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in">
            <Link to="/auth">
              <Button size="lg" className="btn-gradient text-lg px-8">
                Get Started Free
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="text-lg px-8">
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Roles Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Built for Everyone</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Whether you're a marketing agent or a business owner, StatusFlow has the tools you need.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Agent Card */}
            <div className="dashboard-card hover:shadow-large transition-shadow duration-300">
              <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center mb-6">
                <Users className="h-7 w-7 text-primary-foreground" />
              </div>
              <h3 className="text-2xl font-semibold text-foreground mb-4">Marketing Agents</h3>
              <ul className="space-y-3 mb-6">
                {[
                  'Create unlimited campaigns',
                  'Track views and performance',
                  'Earn commissions on campaigns',
                  'Assign campaigns to businesses',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-muted-foreground">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link to="/auth">
                <Button className="w-full btn-gradient">
                  Start as Agent
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>

            {/* Business Card */}
            <div className="dashboard-card hover:shadow-large transition-shadow duration-300">
              <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center mb-6">
                <Briefcase className="h-7 w-7 text-primary-foreground" />
              </div>
              <h3 className="text-2xl font-semibold text-foreground mb-4">Business Owners</h3>
              <ul className="space-y-3 mb-6">
                {[
                  'Review and approve campaigns',
                  'Track campaign performance',
                  'Mark payments as complete',
                  'Full transparency on spending',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-muted-foreground">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link to="/auth">
                <Button className="w-full btn-gradient">
                  Start as Business
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Powerful Features</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need to run successful WhatsApp status marketing campaigns.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <div key={i} className="text-center p-6">
                <div className="w-14 h-14 rounded-xl bg-accent flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="h-7 w-7 text-accent-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 gradient-primary">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-6">
            Ready to Grow Your Business?
          </h2>
          <p className="text-primary-foreground/80 text-xl mb-8 max-w-2xl mx-auto">
            Join hundreds of agents and businesses already using StatusFlow to power their WhatsApp marketing.
          </p>
          <Link to="/auth">
            <Button size="lg" variant="secondary" className="text-lg px-8">
              Get Started Free
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" />
            <span className="font-semibold text-foreground">StatusFlow</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2026 StatusFlow. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
