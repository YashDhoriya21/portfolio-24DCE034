import Header from '../components/Header';
import About from '../components/About';
import Skills from '../components/Skills';

// Props data lives here — passed down to reusable components
const skillList = [
  'HTML',
  'CSS',
  'JavaScript',
  'React',
  'Node.js',
  'Git & GitHub',
  'Python',
  'SQL',
];

function Home() {
  return (
    <main>
      <Header
        name="Yash Dhoriya"
        role="B.Tech Computer Engineering Student"
        bio="Passionate about Web Development, Programming, and Learning New Technologies."
        university="CHARUSAT University | Gujarat, India"
      />
      <About />
      <Skills skillList={skillList} />
    </main>
  );
}

export default Home;
