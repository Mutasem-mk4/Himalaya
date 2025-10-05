import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { format } from "date-fns";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CalendarIcon, Users, MapPin, Maximize, Check, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function ApartmentDetails() {
  const { id } = useParams();
  const { t, language } = useLanguage();
  const [chalet, setChalet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [adults, setAdults] = useState("2");
  const [children, setChildren] = useState("0");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    specialRequests: ""
  });

  useEffect(() => {
    const fetchChalet = async () => {
      try {
        const { data, error } = await supabase
          .from('chalets')
          .select('*')
          .eq('id', id)
          .eq('status', 'active')
          .single();

        if (error) throw error;
        setChalet(data);
      } catch (error) {
        console.error('Error fetching chalet:', error);
        toast.error(t.common?.error || "Failed to load chalet");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchChalet();
    }
  }, [id, t]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const bookingData = {
      chalet_name: chalet?.title || '',
      chalet_location: `${chalet?.location || ''} - ${chalet?.address || ''}`,
      check_in: startDate ? format(startDate, "PPP") : '',
      check_out: endDate ? format(endDate, "PPP") : '',
      adults: adults,
      children: children,
      first_name: formData.firstName,
      last_name: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      special_requests: formData.specialRequests,
      price_per_night: chalet?.price_per_night || 0
    };

    try {
      const response = await fetch('https://formspree.io/f/mldpljon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bookingData)
      });

      if (response.ok) {
        toast.success(t.bookingForm?.bookingConfirmed || "Booking request sent successfully!");
        // Reset form
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          specialRequests: ""
        });
        setStartDate(undefined);
        setEndDate(undefined);
        setAdults("2");
        setChildren("0");
      } else {
        throw new Error('Failed to submit');
      }
    } catch (error) {
      console.error('Error submitting booking:', error);
      toast.error(t.common?.error || "Failed to submit booking. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-20 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">{t.common?.loading || "Loading..."}</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!chalet) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-20 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">{t.common?.notFound || "Chalet not found"}</h1>
            <Button asChild>
              <Link to="/apartments">
                <ChevronLeft className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
                {t.common?.backToApartments || "Back to Apartments"}
              </Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-20">
        {/* Header Section */}
        <section className="relative py-16 bg-gradient-to-r from-sea-light to-white dark:from-sea-dark dark:to-background overflow-hidden">
          <div className="container relative z-10">
            <Button variant="ghost" asChild className="mb-4">
              <Link to="/apartments">
                <ChevronLeft className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
                {t.common?.backToApartments || "Back to Apartments"}
              </Link>
            </Button>
            <div className="max-w-4xl animate-fade-in">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                {chalet.title}
              </h1>
              <div className="flex items-center text-muted-foreground text-lg gap-4">
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 ltr:mr-2 rtl:ml-2" />
                  <span>{chalet.location} - {chalet.address}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="container py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Chalet Info */}
            <div className="lg:col-span-2 space-y-6">
              <div className="glass-card p-6">
                <h2 className="text-2xl font-bold mb-4">{t.apartments?.description || "Description"}</h2>
                <p className="text-muted-foreground mb-6">{chalet.description}</p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">{t.bookingForm?.guests || "Guests"}</p>
                      <p className="font-semibold">{chalet.max_guests}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Maximize className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">{t.bookingForm?.bedrooms || "Bedrooms"}</p>
                      <p className="font-semibold">{chalet.bedrooms}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Maximize className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">{t.bookingForm?.bathrooms || "Bathrooms"}</p>
                      <p className="font-semibold">{chalet.bathrooms}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div>
                      <p className="text-sm text-muted-foreground">{t.booking?.summary?.pricePerNight || "Price"}</p>
                      <p className="font-semibold text-primary">{chalet.price_per_night} JD</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Booking Form */}
            <div className="lg:col-span-1">
              <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4 sticky top-24">
                <h3 className="text-xl font-bold mb-4">{t.bookingForm?.title || "Book Now"}</h3>
                
                {/* Dates */}
                <div className="space-y-2">
                  <Label htmlFor="check-in">{t.bookingForm?.checkIn || "Check-in"}</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="check-in"
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
                        {startDate ? format(startDate, "PPP") : <span>{t.bookingForm?.selectDate || "Select date"}</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                        disabled={(date) => date < new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="check-out">{t.bookingForm?.checkOut || "Check-out"}</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="check-out"
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP") : <span>{t.bookingForm?.selectDate || "Select date"}</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                        disabled={(date) => date < (startDate || new Date())}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Guests */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="adults">{t.bookingForm?.adults || "Adults"}</Label>
                    <Select value={adults} onValueChange={setAdults}>
                      <SelectTrigger id="adults">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6].map((num) => (
                          <SelectItem key={num} value={num.toString()}>
                            {num}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="children">{t.bookingForm?.children || "Children"}</Label>
                    <Select value={children} onValueChange={setChildren}>
                      <SelectTrigger id="children">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[0, 1, 2, 3, 4].map((num) => (
                          <SelectItem key={num} value={num.toString()}>
                            {num}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Guest Info */}
                <div className="space-y-2">
                  <Label htmlFor="firstName">{t.contact?.form?.name || "First Name"}</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">{t.contact?.form?.name || "Last Name"}</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">{t.contact?.form?.email || "Email"}</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">{t.contact?.form?.phone || "Phone"}</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="specialRequests">{t.contact?.form?.message || "Special Requests"}</Label>
                  <Textarea
                    id="specialRequests"
                    name="specialRequests"
                    value={formData.specialRequests}
                    onChange={handleInputChange}
                    rows={3}
                  />
                </div>

                <Button type="submit" className="w-full btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ltr:mr-2 rtl:ml-2"></div>
                      {t.common?.sending || "Sending..."}
                    </>
                  ) : (
                    <>
                      <Check className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
                      {t.bookingForm?.submit || "Submit Booking"}
                    </>
                  )}
                </Button>
              </form>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
