const cards = document.querySelectorAll('.card');
const btnLeft = document.querySelector('.nav-btn.left');
const btnRight = document.querySelector('.nav-btn.right');
const track = document.querySelector('.carousel-cards');

let currentIndex = 0;

function updateCarousel() {
  cards.forEach(card => card.classList.remove('active'));
  cards[currentIndex].classList.add('active');

  const cardWidth = cards[0].offsetWidth + 40; // width + margin
  const offset = -(currentIndex * cardWidth) + (track.parentElement.offsetWidth / 2 - cardWidth / 2);

  track.style.transform = `translateX(${offset}px)`;
}

btnRight.addEventListener('click', () => {
  currentIndex = (currentIndex + 1) % cards.length;
  updateCarousel();
});

btnLeft.addEventListener('click', () => {
  currentIndex = (currentIndex - 1 + cards.length) % cards.length;
  updateCarousel();
});

window.addEventListener('resize', updateCarousel);

updateCarousel();
