const slides = document.querySelectorAll(".slides img");
const slides_2 = document.querySelectorAll(".slides_2 img");
let slideIndex = 0;
let slideIndex_2 = 0;
let intervalId = null;
let intervalId_2 = null;

//initializeSlider();
document.addEventListener("DOMContentLoaded", initializeSlider);

function initializeSlider()
{
    if(slides.length > 0)
    {
        slides[slideIndex].classList.add("displaySlide");
        intervalId = setInterval(nextSlide, 5000);
    }
    if(slides_2.length > 0)
        {
            slides_2[slideIndex_2].classList.add("displaySlide_2");
            intervalId_2 = setInterval(nextSlide_2, 5000);
        }
}

function showSlide(index)
{
    if(index >= slides.length)
    {
        slideIndex = 0;
    }else if(index < 0)
    {
        slideIndex = slides.length - 1;
    }

    slides.forEach(slide => {
        slide.classList.remove("displaySlide");
    });
    slides[slideIndex].classList.add("displaySlide");
    //--------------------------------------------------
}

function showSlide_2(index_2)
{
    if(index_2 >= slides_2.length)
        {
            slideIndex_2 = 0;
        }else if(index_2 < 0)
        {
            slideIndex_2 = slides_2.length - 1;
        }
    
        slides_2.forEach(slide_2 => {
            slide_2.classList.remove("displaySlide_2");
        });
        slides_2[slideIndex_2].classList.add("displaySlide_2");
}

function prevSlide()
{
    clearInterval(intervalId);
    slideIndex--;
    showSlide(slideIndex);
}

function nextSlide()
{
    slideIndex++;
    showSlide(slideIndex);
}

function prevSlide_2()
{
    clearInterval(intervalId_2);
    slideIndex_2--;
    showSlide_2(slideIndex_2);
}

function nextSlide_2()
{
    slideIndex_2++;
    showSlide_2(slideIndex_2);
}