const homePage = `
    <div class="content" style="background-color: #cd113b;" id="home">
    <img src="./res/me.jpeg" height="200px" style="border-radius: 50%; margin-bottom: 30px"></img>
    <h1 class="text-center">Hi!</h1>
    <h3 class="text-center">My name is Swarnim Doegar</h3>
    <h4 style="margin-top: 30px;" class="text-center">I am a Web Developer.</h4>
    </div>
`;

const projectsHTML = projectList
  .map((project) => {
    return `
    <span class="project">
    <h4>${project.name}</h4>
    <p>${project.description}</p>
    <a href="${project.githubLink}">Visit Repo &#10022;</a>
    </span>`;
  })
  .reduce((acc, str) => acc + str, "");

const projectsPage = `
    <div class="content" style="background-color: #FF7600;" id="projects">
    <h2 class="heading">projects</h2>
    ${projectsHTML}
    </div>
`;

const imgWidth = Math.min(500, 0.85 * window.innerWidth);
const skillsPage = `
    <div class="content" id="skills" style="background-color: #FFA900;">
    <h2 class="heading">skills</h2>
    <img src="./res/skillcloud.png" alt="skills" class="skillcloud" width="${imgWidth}">
    </div>
`;

const certificatesHTML = certificates.reverse().map((cert) => {
  return `
    <span class="certificate">
    <h4>${cert.name}</h4>
    <h3>${cert.provider}</h3>
    <p>${cert.from} - ${cert.to}</p>
    <a href="${cert.link}">View &#10003;</a>
    </span>
  `;
}).reduce((acc, str) => acc + str, "")
const certificatesPage = `
    <div class="content" id="certificates" style="background-color: #FF4848">
    <h2 class="heading">certificates</h2>
    ${certificatesHTML}
    </div>
`;

const connectPage = `
    <div class="content" style="background-color: #FFD371;" id="connect">
    <h2 class="heading">connect</h2>
    <div class="sites">
    <a href="https://github.com/SwarnimDoegar"><img src="./res/github.png" alt="github"></a>
    <a href="https://www.linkedin.com/in/swarnim-doegar/"><img src="./res/linkedin.png" alt="linkedin"></a>
    <a href="mailto:swarnimdoegar@gmail.com"><img src="./res/email.png" alt="email"></a>
    </div>
    </div>
`;

const pages = [homePage, projectsPage, skillsPage, certificatesPage, connectPage];
