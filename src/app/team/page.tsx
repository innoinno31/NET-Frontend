import OurTeam from "@/components/OurTeam";
import ContactForm from "@/components/ContactForm";

function Contact() {

    return (
      <div className="flex flex-col justify-center items-center pb-12 sm:pb-24">
        <OurTeam />
        <ContactForm />
      </div>
    )
  }

  export default Contact