var init = function(target) {
    target.setup = function () {
      target.createCanvas(1000, 800, target.WEBGL);
    }
    target.draw = function () {
      target.background('rgb(70, 0, 255)');
      target.stroke(255);
      target.noFill();
      target.push();
      target.fill(255);
      target.translate(-150, 50);
      target.noStroke();
      target.rotateX(target.PI);
      target.rotateY(target.frameCount*0.01);
      target.ambientLight(160);
      target.ambientMaterial(255, 255, 255);
      target.pointLight(250, 250, 250, 20, 0, 500);
      target.cone(120, 300);
      target.pop();

      target.push();
      target.fill(255);
      target.noStroke();
      target.translate(-150, 50);
      target.ambientLight(130);
      target.ambientMaterial(255, 255, 255);
      target.pointLight(250, 250, 250, 50, 50, 200);
      target.cylinder(100, 1);
      target.pop();

      target.push();
      target.fill(255);
      target.noStroke();
      target.translate(100, 100, -50);
      // target.ambientLight(100);
      target.ambientMaterial(255, 255, 255);
      target.pointLight(250, 250, 250, 20, 0, 200);
      target.cylinder(50, 100);
      target.pop();

      target.push();
      target.translate(-350, 100, 50);
      target.rotateY(target.frameCount*0.01);
      target.cylinder(50, 150);
      target.pop();


      target.push();
      target.translate(100, -100, -200);
      target.rotateY(target.frameCount*0.01);
      target.rotateX(1.1);
      target.sphere(150);
      target.pop();
    }
}

window.onload = function () {
    new p5(init);
}