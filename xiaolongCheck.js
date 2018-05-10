function checkMin(checkin, checkout, array){
	minDate = 23;
	for (let i = 0; i < 5; i++) {
		for (let j = checkin-minDate; index < checkout-minDate; j++) {
			tmin = 1000;	// 将最少房间数量设置为一个较大值
			if(tmin>array[i][j]){
				tmin = array[i][j];
			}
			// TODO: 将tmin传给对应房间的HTML数据即可
			// ...
		}
	}
}


function perseDate(string){
	var array = string.split(comma);
	var a;
	for (let i = 0; i < array.length; i++) {
		for (let j = 0; j < array.length; j++) {
			a[i][j] = parseInt(array[i*6+j]);
		}
	}
	checkMin(checkin,checkout,a);
}