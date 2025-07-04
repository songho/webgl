///////////////////////////////////////////////////////////////////////////////
// convolutionUtils.js
// ===================
// utility functions for convolution and kernel
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2025-05-22
// UPDATED: 2025-06-29
///////////////////////////////////////////////////////////////////////////////


///////////////////////////////////////////////////////////////////////////////
// generate 1D seperable Gaussian kernel
// kernelSize should be odd number (3, 5, 7, 9, ...) because even function
// It returns Float32Array with arraySize
///////////////////////////////////////////////////////////////////////////////
function generateGaussianKernel(sigma, kernelSize)
{
    let kernel = new Float32Array(kernelSize);

    // compute kernel elements normal distribution equation(Gaussian)
    // do only half(positive area) and mirror to negative side
    // because Gaussian is even function, symmetric to Y-axis.
    let center = Math.floor(kernelSize / 2);   // center value of n-array(0 ~ n-1)

    let result = 0;
    let sum = 0;
    if(sigma == 0)
    {
        kernel.fill(0);
        kernel[center] = 1.0;
    }
    else
    {
        const SS2 = sigma * sigma * 2;
        kernel[center] = 1;
        sum = 1;
        for(let i = 1; i <= center; ++i)
        {
            // dividing (sqrt(2*PI)*sigma) is not needed because normalizing result later
            result = Math.exp(-(i*i)/SS2);
            kernel[center+i] = kernel[center-i] = result;
            sum += result;
            sum += result;
        }

        // normalize kernel
        // make sum of all elements in kernel to 1
        for(let i = 0; i <= center; ++i)
            kernel[center+i] = kernel[center-i] /= sum;
    }
    return kernel;
}



///////////////////////////////////////////////////////////////////////////////
// generate half of Gaussian kernel, starting from the center to positive
// It returns Float32Array
///////////////////////////////////////////////////////////////////////////////
function generateHalfGaussianKernel(sigma, halfKernelSize)
{
    // compute kernel elements normal distribution equation(Gaussian)
    // do only half(positive area)
    let kernel = new Float32Array(halfKernelSize);
    let result = 0;
    let sum = 0;
    if(sigma == 0)
    {
        kernel.fill(0);
        kernel[0] = 1.0;
    }
    else
    {
        const SS2 = sigma * sigma * 2;
        kernel[0] = 1;
        sum = 1;
        for(let i = 1; i < halfKernelSize; ++i)
        {
            // dividing (sqrt(2*PI)*sigma) is not needed because normalizing result later
            result = Math.exp(-(i*i)/SS2);
            kernel[i] = result;
            sum += result * 2;
        }

        // normalize kernel
        // make sum of all elements in kernel to 1
        for(let i = 0; i <= halfKernelSize; ++i)
            kernel[i] /= sum;
    }
    return kernel;
}



///////////////////////////////////////////////////////////////////////////////
// resize kernel array
// if newSize greater than original, padd zeros
///////////////////////////////////////////////////////////////////////////////
function resizeKernel(kernel, newSize)
{
    let newKernel = new Float32Array(newSize);
    newKernel.fill(0);

    let kernelSize = kernel.length;
    let offset = Math.floor((newSize - kernelSize) / 2);
    for(let i = 0, j = offset; i < kernelSize; ++i, ++j)
    {
        if(j >= 0)
            newKernel[j] = kernel[i];
    }

    return newKernel;
}

function resizeHalfKernel(kernel, newSize)
{
    let newKernel = new Float32Array(newSize);
    newKernel.fill(0);

    let kernelSize = kernel.length;
    for(let i = 0; i < kernelSize; ++i)
    {
        if(i < newSize)
            newKernel[i] = kernel[i];
    }

    return newKernel;
}



///////////////////////////////////////////////////////////////////////////////
// generate 1D average (box) kernel
// It returns Float32Array
///////////////////////////////////////////////////////////////////////////////
function generateAverageKernel(kernelSize=9)
{
    let k = new Float32Array(kernelSize);
    k.fill(1);
    // normalize kernel
    for(let i = 0; i < kernelSize; ++i)
    {
        k[i] /= kernelSize;
    }
    return k;
}



///////////////////////////////////////////////////////////////////////////////
// generate 3x3 Sobel kernel for edge detection (row-major)
// direction: 0 = horizontal derivative
//            1 = vertical derivative 
// It returns Float32Array
///////////////////////////////////////////////////////////////////////////////
function generateSobelKernel(direction=0)
{
    let k = new Float32Array(9);
    if(direction == 0)
    {
        k[0] = -1;  k[1] =  0;  k[2] =  1;
        k[3] = -2;  k[4] =  0;  k[5] =  2;
        k[6] = -1;  k[7] =  0;  k[8] =  1;
    }
    else
    {
        k[0] = -1;  k[1] = -2;  k[2] = -1;
        k[3] =  0;  k[4] =  0;  k[5] =  0;
        k[6] =  1;  k[7] =  2;  k[8] =  1;
    }
    return k;
}



///////////////////////////////////////////////////////////////////////////////
// generate 3x3 emboss kernel based on Sobel (row-major)
// direction: 0 = top-left to bottom-right
//            1 = top-left to bottom-left 
// It returns Float32Array
///////////////////////////////////////////////////////////////////////////////
function generateEmbossKernel(direction=0)
{
    let k = new Float32Array(9);
    if(direction == 0)
    {
        k[0] = -2;  k[1] = -1;  k[2] =  0;
        k[3] = -1;  k[4] =  1;  k[5] =  1;
        k[6] =  0;  k[7] =  1;  k[8] =  2;
    }
    else if(direction == 1)
    {
        k[0] =  0;  k[1] = -1;  k[2] = -2;
        k[3] =  1;  k[4] =  1;  k[5] = -1;
        k[6] =  2;  k[7] =  1;  k[8] =  0;
    }
    return k;
}



///////////////////////////////////////////////////////////////////////////////
// generate 3x3 Laplacian (2nd-order derivative) kernel for edge detection
// It returns Float32Array
///////////////////////////////////////////////////////////////////////////////
function generateLaplacianKernel()
{
    let k = new Float32Array(9);
    k[0] =  0;  k[1] = -1;  k[2] =  0;
    k[3] = -1;  k[4] =  4;  k[5] = -1;
    k[6] =  0;  k[7] = -1;  k[8] =  0;
    return k;
}



///////////////////////////////////////////////////////////////////////////////
// generate 3x3 sharpening kernel baed on Laplacian
// It returns Float32Array
///////////////////////////////////////////////////////////////////////////////
function generateSharpeningKernel()
{
    let k = new Float32Array(9);
    k[0] =  0;  k[1] = -1;  k[2] =  0;
    k[3] = -1;  k[4] =  5;  k[5] = -1;
    k[6] =  0;  k[7] = -1;  k[8] =  0;
    return k;
}



///////////////////////////////////////////////////////////////////////////////
// return sum of kernel elements, should be 1
///////////////////////////////////////////////////////////////////////////////
function computeKernelSum(kernel)
{
    let sum = 0;
    for(let i = 0; i < kernel.length; ++i)
        sum += kernel[i];
    return sum;
}
function computeHalfKernelSum(kernel)
{
    let sum = kernel[0];
    for(let i = 1; i < kernel.length; ++i)
        sum += kernel[i] * 2;
    return sum;
}



///////////////////////////////////////////////////////////////////////////////
// return optimal kernel size based on sigma
///////////////////////////////////////////////////////////////////////////////
function computeGaussianKernelSize(sigma)
{
    // determine size of kernel (odd #)
    // sigma = 0          : 1
    // 0.0 <  sigma < 0.5 : 3
    // 0.5 <= sigma < 1.0 : 5
    // 1.0 <= sigma < 1.5 : 7
    // 1.5 <= sigma < 2.0 : 9
    // 2.0 <= sigma < 2.5 : 11
    // 2.5 <= sigma < 3.0 : 13 ...
    if(sigma <= 0)
        return 1;
    else
        return 2 * Math.round(2 * sigma) + 3;
}



