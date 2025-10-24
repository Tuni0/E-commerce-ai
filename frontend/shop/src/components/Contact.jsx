import { BsGithub } from "react-icons/bs";
import { BsLinkedin } from "react-icons/bs";
import { BsHeartFill } from "react-icons/bs";
import React from "react";

const sections = [
  {
    title: "Support",
    content: ["Submit a request", "Help Center", "Contact Us"],
  },
  {
    title: "Company",
    content: ["About Us", "Careers", "Press", "Blog"],
  },
  {
    title: "Legal",
    content: ["Privacy Policy", "Terms of Service", "Security"],
  },
];

function Contact() {
  function handleGithub() {
    window.open("https://github.com/Tuni0");
  }

  function handleLinkedIn() {
    window.open("https://www.linkedin.com/in/wiktor-mazepa-812199338/");
  }
  return (
    <div id="footer" className="flex flex-col pt-8   rounded-xl ">
      <div className="flex flex-row justify-between mb-24">
        <div className="flex flex-col pl-8 ">
          <div className=" mb-8 mt-12">
            <div className="flex flex-row">
              <span className="pr-4 text-gray-900 dark:text-white ">
                Made with love by Wiktor Mazepa{" "}
              </span>
              <BsHeartFill className="text-2xl text-red-500" />
            </div>
            <div className="text-center pt-12">
              <a
                href="mailto:wiktor.mazepa@gmail.com "
                className="text-1xl text-gray-900 dark:text-white "
              >
                wiktor.mazepa@gmail.com
              </a>
            </div>
          </div>
          <div>
            <button
              type="button"
              onClick={() => handleGithub()}
              className="-m-2.5  p-2.5 text-gray-700 mr-4 "
            >
              <BsGithub className="text-4xl text-gray-900 dark:text-white" />
            </button>
            <button
              type="button"
              onClick={() => handleLinkedIn()}
              className="-m-2.5  p-2.5 text-gray-700 "
            >
              <BsLinkedin className="text-4xl text-gray-900 dark:text-white" />
            </button>
          </div>
        </div>
        <div className="flex flex-row pr-96">
          {sections.map((section) => (
            <div
              key={section.title}
              className="text-left px-12 m-4 space-y-4 text-gray-900 dark:text-white "
            >
              <a className=" font-semibold text-xl text-left">
                {section.title}
              </a>
              {section.content.map((item, index) => (
                <div className="text-left " key={index}>
                  <a href="#" className="text-gray-900 dark:text-white">
                    {item} <br></br>
                  </a>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Contact;
