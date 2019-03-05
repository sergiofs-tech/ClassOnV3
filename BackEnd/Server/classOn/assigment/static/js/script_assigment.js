/* Global variables */
var doubtId = 0;
var thisGroup = 0;
var textoGlobal = 'default';
var doubtsContainer = [];
var doubtsContainerObj = [];


/* Plain JS Code */
$(document).ready(function() {

    queryDoubts();
    $("#btn_answer").click (answerDoubt);
    // $('#modal_answer').on('show.bs.modal', function (event) {
    //     var button = $(event.relatedTarget);                // Button that triggered the modal
    //     doubtId = button.data('doubtid');                   // Extract info from data-* attributes and store in global variable

    //     // Add doubt text to the modal
    //     var modal = $(this);
    //     var doubtSelector = '#doubt_' + doubtId;
    //     var doubtText = $(doubtSelector + '.card .card-body .card-text').text()
    //     modal.find(".modal-body #modal_doubt_text").text(doubtText);
    // });
    $("#doubt").submit(doubt_click);

    socket.emit('get_user');

    var container = document.getElementById("assign-container");
    var str = container.textContent;
    container.innerHTML = str;

    get_doubts_container();
    $("#gif").removeClass("hide");

    setTimeout(function(){ 
        $("#gif").addClass("hide");
        paintDoubts(); 
    }, 2000);

    $("#doubtPostGOOD").click( function() {
        var text = document.getElementById('doubtText').value;
        if (text != "") {
            socket.emit('doubt_post', text, thisGroup.id);
            textoGlobal = text;
            // queryDoubts();        
        }
    });

});

function paintDoubts() {

    console.log('painting', doubtsContainer);

    for (i=0; i < doubtsContainer.length; i++) {
        if (!doubtsContainer[i].resolved) {
            console.log('paintDoubts', doubtsContainer[i]);
            appendDoubt (doubtsContainer[i])
        }
    }
} 

/* Functions */
// Add a doubt to the HTML
function appendDoubt( doubtObj ) {   
    
    console.log('appendDoubt', doubtObj);

    if (getCurrentSection() == doubtObj.section) {

        let doubts = $("#doubts");     

        if (doubtObj.student == thisGroup.position){
            const newDoubtHTML = 
            '<div class="card" id=\"doubt_' + doubtObj.number + '\">' + 
                '<div class="card-body">' +
                    '<span class="badge badge-info">Section: ' + doubtObj.section + '</span>' + 
                    '<span class="badge"> OWN DOUBT </span>' + 
                    '<p class="card-text">' + doubtObj.db_text + '</p>' + 
                '</div>' + 
                '<ul class="list-group list-group-flush">' +
                    // '<li class="list-group-item list-group-item-secondary">Cras justo odio</li>' +        
                '</ul>' +
                '<div class="card-body">' +
                    '<button type=\"button\" onclick=\"solveDoubt('+ doubtObj.number + ', '+ numberize(doubtObj.student) + ')\" id=\"' + doubtObj.number + '\" class=\"btn btn-primary float-right\"' +
                    'data-doubtid=\"'+ doubtObj.number + '\">Solve doubt</button>' +           
                '</div>' +
            '</div>' +
            '<br>'
            doubts.append(newDoubtHTML);

        } else {
            const newDoubtHTML = 
            '<div class="card" id=\"doubt_' + doubtObj.number + '\">' + 
                '<div class="card-body">' +
                    '<span class="badge badge-info">Section: ' + doubtObj.section + '</span>' + 
                    '<p class="card-text">' + doubtObj.db_text + '</p>' + 
                '</div>' + 
                '<ul class="list-group list-group-flush">' +
                    // '<li class="list-group-item list-group-item-secondary">Cras justo odio</li>' +        
                '</ul>' +
                '<div class="card-body">' +         
                '</div>' +
            '</div>' +
            '<br>'
            doubts.append(newDoubtHTML);
        }
    }
}

function numberize (group) {
    var num1 = parseInt(group.charAt(0));
    var num2 = parseInt(group.charAt(2));
    var res = num1*10 + num2;
    return res;
}

function solveDoubt(doubtId, groupId) {

    var element = document.getElementById('doubt_' + doubtId);
    if(element!= null) {
        element.parentNode.removeChild(element);    
    }
    socket.emit('solve_doubt', { doubt: doubtId, group: groupId, ownId: 0 });
}

socket.on('get_doubts2', function(doubts) {
    console.log('get doubts2', doubts);
    if (doubts!=null){ 
        doubtsContainer = doubts;
    }
});


socket.on('the_doubt_solved', function(data) {
    var id = data.doubt;
    var group = data.group;
    solveDoubt (id, group); 
});

socket.on('get_user', function(group) {
    if (thisGroup == 0){ 
        thisGroup = JSON.parse(group);
        console.log('get_user: ', thisGroup);
    }
});



/* Socket.io */
/** Emits  **/

function get_doubts_container() {
    console.log('get_doubts_container1');
    socket.emit('get_doubts1');
}

function set_doubts_container() {
    console.log('set_doubts_container');
    socket.emit('set_doubts', doubtsContainer);
}


// Generated new doubt --> upload to server
function doubt_click(event) {
    // alert('ey');
    socket.emit('doubt_post', text);
}

// Ask for doubts
function queryDoubts()
{
    socket.emit('doubt_query');
}

function answerDoubt(event)
{
    var answ = $("#text_answer").val();
    $("#text_answer").val('')                               //Clenan field

    if (answ.length > 0)
    {
        socket.emit('answer_post', doubtId, answ);
        $('#modal_answer').modal('hide');
    } else
    {
        
    }
}

function DoubtClass(number, student, db_text, section, resolved){
    this.number = number;
    this.student = student;
    this.db_text = db_text; 
    this.section = section;
    this.resolved = resolved
}


/** Responses **/
// New doubt from server
socket.on('doubt_new', function(doubt) {   
    var doubtJson = JSON.parse(doubt);
    console.log('doubt_new on', doubtJson);
    var doubtObject = new DoubtClass (parseInt(doubtJson.db_id), doubtJson.group, doubtJson.text, parseInt(doubtJson.section), false);

    appendDoubt(doubtObject); // Insert on HTML
    get_doubts_container();
    console.log('in doubt new', doubtsContainer);
    doubtsContainer.push(doubtObject);
    set_doubts_container();

});


function getCurrentSection () {
    var prog = $('.active')
    console.log ('active', prog);
    var currentSection = prog[0].id;
    console.log('currentSection', currentSection);
    return currentSection;
}


// Doubts query result
socket.on('doubt_query_result', function(doubtsJson) {
    var result = JSON.parse(doubtsJson);
    var doubts = result.doubts;

    for(var i in doubts)
    {
        appendDoubt(doubts[i]);
        for(var j in doubts[i].answers)
        {
            appendAnswer(doubts[i].db_id, doubts[i].answers[j].text);
        }
    }
})

socket.on('new_answer', function(anwserJson)
{
    var answer = JSON.parse(anwserJson);
    var doubtId = answer.doubtid;
    var text = answer.text;
    appendAnswer(doubtId, text);
})

function appendAnswer(doubtId, anwser)
{
    var li = '<li class="list-group-item list-group-item-secondary">'+ anwser +'</li>';        
    $('#doubt_' + doubtId + '> ul').append(li);
}