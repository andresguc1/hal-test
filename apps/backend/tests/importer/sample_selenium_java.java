package com.example.tests;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.firefox.FirefoxDriver;
import org.junit.Test;

public class SampleTest {
    @Test
    public void testGoogleSearch() {
        WebDriver driver = new FirefoxDriver();
        driver.get("http://www.google.com");
        
        WebElement searchBox = driver.findElement(By.name("q"));
        searchBox.sendKeys("Selenium Java");
        
        driver.findElement(By.name("btnK")).click();
        
        driver.quit();
    }
}
