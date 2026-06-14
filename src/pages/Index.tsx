import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Monitor, Users, Eye } from "lucide-react";
import hospitalLogo from "@/assets/hospital-logo.png";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen overflow-hidden">

      {/* Spline Background */}
      <iframe
        src="https://my.spline.design/glassropescopycopy-CdC93AtJr7eYH36cV5jT0IGs-1Hv/"
        className="fixed top-0 left-0 w-full h-full -z-20 pointer-events-none"
        frameBorder="0"
      />

      {/* Dark Overlay for readability */}
      <div className="fixed top-0 left-0 w-full h-full bg-black/50 -z-10" />

      {/* Main Content */}
      <div className="relative z-10 min-h-screen">
        <div className="container mx-auto px-4 py-12">
          
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <img src={hospitalLogo} alt="Hospital Logo" className="h-32 w-auto" />
            </div>

            <h1 className="text-5xl font-bold text-white mb-4">
              Mahatme Eye Hospital
            </h1>

            <p className="text-2xl text-gray-200 mb-2">
              OPD Queue Management System
            </p>

            <div className="flex items-center justify-center gap-2 text-primary">
              <Eye className="h-6 w-6" />
              <p className="text-lg text-gray-200">
                Real-time Patient Queue Management
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            
            <Card className="p-8 hover:shadow-xl transition-shadow bg-white/90 backdrop-blur">
              <div className="flex flex-col items-center text-center">
                <div className="bg-primary/10 p-6 rounded-full mb-4">
                  <Monitor className="h-12 w-12 text-primary" />
                </div>

                <h2 className="text-2xl font-bold mb-3">
                  Display Dashboard
                </h2>

                <p className="text-muted-foreground mb-6">
                  Large screen display for showing current and next patients in queue.
                  Perfect for TV/LED displays in waiting areas.
                </p>

                <Button
                  size="lg"
                  onClick={() => navigate("/display")}
                  className="w-full"
                >
                  Go to Display Dashboard
                </Button>
              </div>
            </Card>

            <Card className="p-8 hover:shadow-xl transition-shadow bg-white/90 backdrop-blur">
              <div className="flex flex-col items-center text-center">
                <div className="bg-accent/10 p-6 rounded-full mb-4">
                  <Users className="h-12 w-12 text-accent" />
                </div>

                <h2 className="text-2xl font-bold mb-3">
                  Staff Portal
                </h2>

                <p className="text-muted-foreground mb-6">
                  Register new patients, manage queue, update patient status,
                  and control the flow of the OPD operations.
                </p>

                <Button
                  size="lg"
                  variant="secondary"
                  onClick={() => navigate("/auth")}
                  className="w-full"
                >
                  Go to Staff Login
                </Button>
              </div>
            </Card>
          </div>

          <Card className="mt-12 p-8 max-w-4xl mx-auto bg-white/90 backdrop-blur">
            <div className="text-center space-y-3">
              
              <h3 className="text-3xl font-bold">
                24/7 Eye Care Assistance
              </h3>

              <p className="text-xl font-semibold text-primary">
                Immediate Medical Help – Call Now +91-712-2289 101 to 106
              </p>

              <p className="text-muted-foreground max-w-2xl mx-auto">
                We’re here to care for you with compassion and expertise.
                Visit us for personalized healthcare tailored just for you.
              </p>

              <div className="mt-4 grid gap-2 text-sm sm:text-base">
                <p>Chintaman Nagar, Somalwada, Nagpur – 440025</p>

                <p>
                  <a
                    href="mailto:manager@mahatmehospital.com"
                    className="text-primary underline-offset-2 hover:underline"
                  >
                    manager@mahatmehospital.com
                  </a>
                </p>

                <p className="text-lg font-semibold text-primary">
                  +91-712-2289 101 to 106
                </p>
              </div>
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
};

export default Index;